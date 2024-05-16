import React, { useEffect, useState, useRef } from "react";
import {
  View,
  FlatList,
  Modal,
  StyleSheet,
  RefreshControl,
  PanResponder,
} from "react-native";
import {
  Provider as PaperProvider,
  Card,
  Button,
  Text,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

export default function ProfileScreen({ navigation }) {
  const [buyerInfo, setBuyerInfo] = useState({});
  const [orders, setOrders] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrderItems, setSelectedOrderItems] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 100) {
          navigation.navigate("HomeScreen");
        }
      },
    })
  ).current;

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const buyerData = await AsyncStorage.getItem("buyerData");
      if (buyerData !== null) {
        const buyer = JSON.parse(buyerData);
        setBuyerInfo(buyer);
        const fullName = `${buyer.buyerName} ${buyer.buyerSurname}`;
        const token = await AsyncStorage.getItem("jwtToken");
        console.log(token);
        let body = {
          buyerFullName: fullName,
          sortCreatedAtDescending: true,
        };
        console.log("body = ", body);
        const response = await fetch(
          "http://wims-gateway.azure-api.net/om/filter",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
          }
        );
        const result = await response.json();
        console.log(result);
        setOrders(result);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleOrderPress = (orderItems) => {
    setSelectedOrderItems(orderItems);
    setModalVisible(true);
  };

  return (
    <PaperProvider>
      <View style={styles.container} {...panResponder.panHandlers}>
        <Text style={styles.headerText}>Profile Information</Text>
        <View style={styles.profileSection}>
          <Text style={styles.profileText}>
            Name: {buyerInfo.buyerName} {buyerInfo.buyerSurname}
          </Text>
          <Text style={styles.profileText}>Email: {buyerInfo.buyerEmail}</Text>
          <Text style={styles.profileText}>
            Phone: {buyerInfo.buyerPhoneNumber}
          </Text>
        </View>
        <Text style={styles.headerText}>Orders</Text>
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card
              style={styles.card}
              onPress={() => handleOrderPress(item.orderItems)}
            >
              <Card.Title
                titleStyle={styles.boldText}
                title={`Order ID: ${item.orderId}`}
              />
              <Card.Content>
                <Text>Status: {item.orderStatus}</Text>
                <Text>Created At: {formatDate(item.createdAt)}</Text>
                <Text>Price: ${item.orderPrice.toFixed(2)}</Text>
              </Card.Content>
            </Card>
          )}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={fetchData} />
          }
        />

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}
        >
          <View style={styles.modalView}>
            <FlatList
              data={selectedOrderItems}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Card style={styles.itemCard}>
                  <Card.Content>
                    <Text>Product Name: {item.productName}</Text>
                    <Text>
                      Description: {item.productDescription || "No description"}
                    </Text>
                    <Text>Price: ${item.price.toFixed(2)}</Text>
                    <Text>Quantity: {item.quantity}</Text>
                  </Card.Content>
                </Card>
              )}
            />
            <Button
              mode="contained"
              onPress={() => setModalVisible(false)}
              style={styles.button}
            >
              Close
            </Button>
          </View>
        </Modal>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
    textAlign: "center",
    color: "#000",
    marginTop: 50,
  },
  profileSection: {
    backgroundColor: "#ffffff",
    padding: 30,
    marginHorizontal: 20,
    marginTop: 20, // Lower the profile on the screen
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  profileText: {
    fontSize: 18,
    marginBottom: 10,
  },
  boldText: {
    fontWeight: "bold",
  },
  orderList: {
    flex: 1,
  },
  card: {
    margin: 10,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemCard: {
    marginVertical: 10,
  },
  button: {
    marginTop: 20,
  },
});
