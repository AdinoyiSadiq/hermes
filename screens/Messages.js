/* eslint-disable no-nested-ternary */
import React, { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { StyleSheet, View } from 'react-native';
import { ifIphoneX } from 'react-native-iphone-x-helper';
import MessagesListHeader from '../containers/messages/MessagesListHeader';
import RestrictedContact from '../containers/messages/RestrictedContact';
import MessageInput from '../containers/messages/MessageInput';
import MessageList from '../containers/messages/MessageList';
import MessageOptions from '../containers/messages/MessageOptions';
import ImageUploadContext from '../context/ImageUpload';

import GET_MESSAGES from '../queries/getMessages';
import GET_ACTIVE_CHATS from '../queries/getActiveChats';
import UPDATE_MESSAGE from '../mutations/updateMessage';

import MESSAGE_SUBSCRIPTION from '../subscriptions/messageSubscription';
import DELETED_MESSAGE_SUBSCRIPTION from '../subscriptions/deletedMessageSubscription';
import UPDATED_MESSAGE_SUBSCRIPTION from '../subscriptions/updatedMessageSubscription';

export default function Messages({
  navigation, route, setTabBarVisibility, refetchReceivedContactRequests, refetchContacts
}) {
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [messageToReply, setMessageToReply] = useState(false);
  const [updatedUser, setUpdatedUser] = useState(false);

  const prevMessageSub = useRef();
  const prevDeleteMessageSub = useRef();
  const prevUpdateMessageSub = useRef();

  const { navigate, goBack } = navigation;
  const { user, authUserId } = route.params;

  const {
    loading: messagesLoading,
    error: messagesError,
    data: messagesData,
    fetchMore,
    subscribeToMore,
    client
  } = useQuery(GET_MESSAGES, {
    variables: { receiverId: user.id },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only'
  });
  const [updateMessages] = useMutation(UPDATE_MESSAGE);

  useEffect(() => {
    const activeUsers = client.readQuery({ query: GET_ACTIVE_CHATS });
    const existingActiveUser = activeUsers
                                && activeUsers.getActiveUsers
                                && (activeUsers.getActiveUsers)
                                  .find((activeUser) => activeUser.user.id === user.id);
    if (existingActiveUser) {
      const updatedActiveUsersList = (activeUsers.getActiveUsers).map((activeUser) => {
        const updatedActiveUser = activeUser;
        if (activeUser.user.id === user.id) { updatedActiveUser.unreadMessages = 0; }
        return updatedActiveUser;
      });
      client.writeQuery({
        query: GET_ACTIVE_CHATS,
        data: { getActiveUsers: [...updatedActiveUsersList] }
      });
    }
  }, []);

  useEffect(() => {
    setTabBarVisibility(false);
    return () => {
      setTabBarVisibility(true);
    };
  }, []);

  useEffect(() => {
    if (messagesData && messagesData.getMessages) {
      const messageIds = [];
      messagesData.getMessages.forEach((message) => {
        if ((message.sender.id !== authUserId) && (message.state !== 'delivered')) {
          messageIds.push(message.id);
        }
      });

      if (messageIds.length) {
        updateMessages({
          variables: { state: 'delivered', messageIds },
          update: (cache) => {
            const activeUsers = cache.readQuery({ query: GET_ACTIVE_CHATS });
            const updatedActiveUsers = activeUsers
                && activeUsers.getActiveUsers
                && (activeUsers.getActiveUsers)
                  .map((activeUser) => {
                    const updatedActiveUser = activeUser;
                    if (updatedActiveUser.user.id === user.id) updatedActiveUser.unreadMessages = 0;
                    return updatedActiveUser;
                  });
            cache.writeQuery({
              query: GET_ACTIVE_CHATS,
              data: { getActiveUsers: [...updatedActiveUsers] }
            });
          },
        });
      }
    }
  }, [messagesData]);

  const navigateBack = async () => {
    await setTabBarVisibility(true);
    goBack();
  };

  const navigateToContactProfile = () => {
    navigate('contactProfile');
  };

  const subscribeToNewMessages = () => {
    if (prevMessageSub.current) {
      prevMessageSub.current();
    }
    prevMessageSub.current = subscribeToMore({
      document: MESSAGE_SUBSCRIPTION,
      variables: {
        senderId: user.id,
        receiverId: authUserId
      },
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        const { message } = subscriptionData.data;
        return {
          ...prev,
          getMessages: [message, ...prev.getMessages]
        };
      }
    });
  };

  const subscribeToDeletedMessages = () => {
    // Create a subscription that only works one way specifically for the messaging section, 
    // leave the active chats as is
    if (prevDeleteMessageSub.current) {
      prevDeleteMessageSub.current();
    }
    prevDeleteMessageSub.current = subscribeToMore({
      document: DELETED_MESSAGE_SUBSCRIPTION,
      variables: {
        senderId: user.id,
        receiverId: authUserId
      },
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        const { deletedMessage } = subscriptionData.data;
        return {
          ...prev,
          getMessages: prev.getMessages.filter((message) => message.id !== deletedMessage.id)
        };
      }
    });
  };

  const subscribeToUpdatedMessages = () => {
    if (prevUpdateMessageSub.current) {
      prevUpdateMessageSub.current();
    }
    prevUpdateMessageSub.current = subscribeToMore({
      document: UPDATED_MESSAGE_SUBSCRIPTION,
      variables: {
        senderId: authUserId,
        receiverId: user.id
      },
    });
  };

  const fetchMoreMessages = (limit) => {
    fetchMore({
      variables: {
        receiverId: user.id,
        cursor: messagesData.getMessages[messagesData.getMessages.length - 1].createdAt,
        limit: limit || 15,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        if (fetchMoreResult.getMessages.length < (limit || 15)) {
          setHasMoreMessages(false);
        }
        const updatedMessages = [...prev.getMessages, ...fetchMoreResult.getMessages];
        return {
          ...prev,
          getMessages: updatedMessages
        };
      }
    });
  };

  const getMoreMessages = () => {
    if (!messagesLoading && hasMoreMessages) {
      if (messagesData && messagesData.getMessages) {
        fetchMoreMessages();
      }
    }
  };

  const setShowOptionsState = ({ message }) => {
    setShowOptions({ state: !showOptions.state, message });
  };

  const handleMessageToReply = (message) => {
    setMessageToReply(message);
  };

  return (
    <>
      {
        (
          user.status === 1
          || (user.contact && user.contact.status === 1)
          || user.active
          || updatedUser
        ) ? (
          <View style={styles.container}>
            <ImageUploadContext.Consumer>
              {({ uploadingImage }) => (
                <MessagesListHeader
                  user={user}
                  authUserId={authUserId}
                  navigateBack={navigateBack}
                  navigateToContactProfile={navigateToContactProfile}
                  uploadingImage={uploadingImage}
                />
              )}
            </ImageUploadContext.Consumer>
            <MessageList
              authUserId={authUserId}
              messages={messagesData && messagesData.getMessages}
              loading={messagesLoading}
              showOptions={showOptions}
              getMoreMessages={getMoreMessages}
              setShowOptionsState={setShowOptionsState}
              subscribeToNewMessages={subscribeToNewMessages}
              subscribeToUpdatedMessages={subscribeToUpdatedMessages}
              subscribeToDeletedMessages={subscribeToDeletedMessages}
            />
            <ImageUploadContext.Consumer>
              {({ sendImage }) => (
                <MessageInput
                  user={user}
                  authUserId={authUserId}
                  messageToReply={messageToReply}
                  handleMessageToReply={handleMessageToReply}
                  sendImage={sendImage}
                />
              )}
            </ImageUploadContext.Consumer>
            <MessageOptions
              authUserId={authUserId}
              showOptions={showOptions}
              setShowOptionsState={setShowOptionsState}
              fetchMoreMessages={fetchMoreMessages}
              handleMessageToReply={handleMessageToReply}
            />
          </View>
          ) : (user.status !== 1 || (user.contact && user.contact.status !== 1)) ? (
            <RestrictedContact
              user={user}
              updateUser={setUpdatedUser}
              authUserId={authUserId}
              navigateBack={navigateBack}
              refetchReceivedContactRequests={refetchReceivedContactRequests}
              refetchContacts={refetchContacts}
            />
          ) : <View />
      }
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...ifIphoneX({
      paddingTop: '10%',
    }, {
      paddingTop: '5%',
    }),
    justifyContent: 'space-between',
  },
});
