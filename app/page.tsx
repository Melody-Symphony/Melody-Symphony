"use client"

import { View, Text, StyleSheet } from "react-native"

export default function Page() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to the Audio Player App!</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
  },
})

