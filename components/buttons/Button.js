/* eslint-disable no-nested-ternary */
import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Loader from '../loaders/Loader';

import Colors from '../../constants/Colors';

const Button = ({
  text, handlePress, loading, size
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.authButton,
        size === 'full' ? { width: '100%' }
          : size === 'flex' ? { flex: 1, marginLeft: '2%', marginRight: '2%' }
            : {}
      ]}
      onPress={handlePress}
      disabled={loading}
    >
      {loading ? <Loader /> : (
        <Text style={styles.authButtonText}>
          {text}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  authButton: {
    height: 56,
    width: 187,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
    backgroundColor: Colors.colorOrange,
  },
  authButtonText: {
    color: Colors.colorWhite,
    fontSize: 14,
    fontFamily: 'Muli-Bold',
    fontWeight: '900',
  },
});

export default Button;
