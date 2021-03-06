/* eslint-disable no-nested-ternary */
import React from 'react';
import {
  StyleSheet, Text, Image, View
} from 'react-native';
import Colors from '../../constants/Colors';

const UserImage = ({ user, size }) => {
  return user.profileImage ? (
    <View style={(size === 'small' && styles.userImageContainer)}>
      <Image
        source={{ uri: user.profileImage }}
        style={[size === 'small' ? styles.userImageSmall : styles.userImageMedium]}
      />
    </View>
  ) : (
    <View style={[styles.userImagePlaceholder, (
      size === 'small' ? styles.userImagePlaceholderSmall
        : size === 'large' ? styles.userImagePlaceholderLarge
          : styles.userImagePlaceholderMedium)]}
    >
      <Text style={[styles.userImagePlaceholderText, (
        size === 'small' ? styles.userImagePlaceholderTextSmall
          : size === 'large' ? styles.userImagePlaceholderTextLarge
            : styles.userImagePlaceholderTextMedium)]}
      >
        {`${user.firstname && user.firstname.charAt(0).toUpperCase()}${user.lastname && user.lastname.charAt(0).toUpperCase()}`}
      </Text>
    </View>
  );
};

export default UserImage;

const styles = StyleSheet.create({
  userImageContainer: {
    marginRight: 16,
  },
  userImageMedium: {
    width: 60,
    height: 60,
    borderRadius: 50,
  },
  userImageSmall: {
    width: 32,
    height: 32,
    borderRadius: 50,
  },
  userImagePlaceholder: {
    height: 60,
    width: 60,
    borderRadius: 300,
    backgroundColor: Colors.colorOrangeLight1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userImagePlaceholderMedium: {
    height: 60,
    width: 60,
    borderRadius: 300,
  },
  userImagePlaceholderSmall: {
    height: 32,
    width: 32,
    borderRadius: 50,
    marginRight: 16,
  },
  userImagePlaceholderLarge: {
    height: 150,
    width: 150,
    borderRadius: 500,
  },
  userImagePlaceholderText: {
    fontFamily: 'Muli',
    fontSize: 15,
    fontWeight: '900',
    color: Colors.colorWhite
  },
  userImagePlaceholderTextSmall: {
    fontSize: 14,
  },
  userImagePlaceholderTextMedium: {
    fontSize: 15,
  },
  userImagePlaceholderTextLarge: {
    fontSize: 40,
  },
});
