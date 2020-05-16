/* eslint-disable no-nested-ternary */
/* eslint-disable global-require */
import React, { useState } from 'react';
import {
  StyleSheet, View, Text, ScrollView
} from 'react-native';
import { useLazyQuery } from '@apollo/react-hooks';
import { ifIphoneX } from 'react-native-iphone-x-helper';
import UserList from '../../containers/user/UserList';
import UserListHeader from '../../containers/user/UserHeader';
import Loader from '../../components/loaders/Loader';
import Colors from '../../constants/Colors';

import SEARCH_CONTACTS from '../../queries/searchContacts';
import SEARCH_USERS from '../../queries/searchUsers';

export default function UserListWrapper({
  type, navigation, loading, data,
}) {
  const [searchState, setSearchState] = useState(false);
  const [searchContacts, {
    loading: searchLoading, error: searchError, data: searchData,
  }] = useLazyQuery(SEARCH_CONTACTS);
  const [searchUsers, {
    loading: searchUserLoading, error: searchUserError, data: searchUserData
  }] = useLazyQuery(SEARCH_USERS);

  const search = (searchTerm) => {
    searchContacts({ variables: { searchTerm } });

    if (type === 'contact') {
      searchUsers({ variables: { searchTerm } });
    }
  };

  const filterUsers = (contacts, users) => {
    const contactIds = contacts.reduce((arr, o) => {
      arr.push(o.user.id);
      return arr;
    }, []);
    const filteredUsers = users.filter((userObj) => {
      return !contactIds.includes(userObj.user.id);
    });
    return filteredUsers;
  };

  return (
    <View style={styles.container}>
      <UserListHeader
        search={search}
        setSearchState={setSearchState}
        title={type === 'chat' ? 'Active Chats' : 'Contact List'}
      />
      {(loading || searchLoading || searchUserLoading) ? (
        <View style={styles.loaderContainer}>
          <Loader color="orange" />
        </View>
      ) : (
        (searchState && searchData && searchData.searchContacts.length === 0)
        && ((searchState && searchUserData && searchUserData.searchUsers.length === 0) || type === 'chat')
      ) ? (
        <Text style={styles.emptyListText}>No users were found</Text>
        ) : (
          <ScrollView style={styles.userItemListContainer}>
            <UserList
              type={searchState ? 'search' : type}
              view={type}
              data={(searchState && searchData && searchData.searchContacts) || data}
              users={
              searchState
              && searchUserData
              && searchUserData.searchUsers
              && filterUsers(searchData.searchContacts, searchUserData.searchUsers)
            }
              navigation={navigation}
            />
          </ScrollView>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginLeft: '5%',
    marginRight: '5%',
    ...ifIphoneX({
      paddingTop: '10%',
    }, {
      paddingTop: '5%',
    })
  },
  userItemListContainer: {
    paddingTop: '5%'
  },
  loaderContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.colorWhite,
    justifyContent: 'center',
  },
  emptyListText: {
    color: Colors.colorBlack,
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
  }
});