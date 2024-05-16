import React, { useState, useEffect } from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  Button,
} from "react-native";
import MainButton from "../../components/MainButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [JWT, setJWT] = useState(null);

  const navigateToHomeScreen = () => {
    navigation.navigate("HomeScreen");
  };

  const handleLogin = async () => {
    try {
      const requestBody = {
        username: username,
        password: password,
      };

      const response = await fetch(
        "http://wims-gateway.azure-api.net/um/User/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      console.log("data", data.jwtToken);
      let jwtToken = data.jwtToken;

      // Save JWT token to async storage
      setJWT(jwtToken);
      await AsyncStorage.setItem("jwtToken", jwtToken);

      // Fetch warehouses after successful login
      navigateToHomeScreen();
    } catch (error) {
      console.error("Login failed:", error);
      Alert.alert(
        "Login failed",
        "Please check your credentials and try again."
      );
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../../obrazky/mall.png")}
        style={styles.image}
      />
      <Text style={styles.header}>
        Pridajte sa k nám a majte prístup k rôznym produktom!
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry={true}
        value={password}
        onChangeText={setPassword}
      />

      <MainButton
        title="Prihlásiť sa"
        onPress={handleLogin}
        backgroundColor="#818e97"
        textColor="white"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "40%",
    resizeMode: "cover",
  },
  header: {
    fontSize: 16,
    padding: 5,
    textAlign: "left",
    fontWeight: "bold",
    fontFamily: "Helvetica",
    marginVertical: 7,
    marginHorizontal: 1.5,
  },
  input: {
    width: "80%",
    height: 40,
    marginBottom: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    height: "50%", // Set the height to 40%
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  buttonContainer: {
    width: "100%",
    marginTop: 20,
  },
});

export default LoginScreen;