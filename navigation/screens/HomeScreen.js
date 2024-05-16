// HomeScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  FlatList,
  SafeAreaView,
} from "react-native";
import { Provider as PaperProvider } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import Checkbox from "expo-checkbox";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { PanGestureHandler, State } from "react-native-gesture-handler";

const HomeScreen = () => {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [basketData, setBasketData] = useState({ products: [] });
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [priceFilter, setPriceFilter] = useState({
    option: "less",
    amount: "100",
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMockBuyerData();
  }, []);
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      fetchFilteredProducts();
    }
  }, [categories]);

  useEffect(() => {
    fetchBasketData();
  }, [modalVisible]); // Fetch basket data when modal is visible

  const setMockBuyerData = async () => {
    const buyerData = {
      buyerName: "Samey",
      buyerSurname: "Slebo",
      buyerPhoneNumber: "1234567890",
      buyerEmail: "samuel.slebo@example.com",
      buyerCountry: "USA",
      buyerCity: "New York",
      buyerZipCode: "10001",
      buyerAddress: "123 Example St",
    };

    try {
      await AsyncStorage.setItem("buyerData", JSON.stringify(buyerData));
    } catch (error) {
      console.error("Error saving data", error);
    }
  };

  const createOrder = async () => {
    const buyerData = await AsyncStorage.getItem("buyerData");
    if (!buyerData) {
      alert("Buyer data not available. Please restart the app.");
      return;
    }
    const parsedBuyerData = JSON.parse(buyerData);
    const orderItems = basketData.products.map((product) => ({
      id: product.id,
      productName: product.productName,
      quantity: product.quantity,
      price: product.price,
      categoryId: product.categoryId, // Assuming categoryId is available in product data
    }));

    const orderPrice_fin = basketData.products.reduce((total, product) => {
      // console.log(
      //   `Price: ${product.price}, Quantity: ${product.quantity}, Current Total: ${total}`
      // );
      // Convert and check if conversion is necessary and correct
      const price = Number(product.price);
      const quantity = Number(product.quantity);
      // console.log(`Converted Price: ${price}, Converted Quantity: ${quantity}`);
      return total + price * quantity;
    }, 0);

    // console.log(`Final Order Price: ${orderPrice_fin}`);

    const orderBody = JSON.stringify({
      orderStatus: "processing",
      orderDescription: "new order",
      orderPrice: orderPrice_fin,
      buyer: parsedBuyerData,
      orderItems: orderItems,
    });
    setIsLoading(true); // Show loading indicator while processing
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      const response = await fetch(
        "http://wims-gateway.azure-api.net/om/createOrder",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: orderBody,
        }
      );

      const result = await response.json();
      if (response.ok) {
        alert("Order created successfully!");

        // Remove each item from the basket via API
        console.log("basket data = ", basketData);
        basketData.products.forEach((product) => removeFromBasket(product.id));

        setBasketData({ products: [] }); // Clear the basket data
        setModalVisible(false); // Close the basket modal
      } else {
        throw new Error(result.message || "Failed to create order");
      }
    } catch (error) {
      console.error("Failed to create order:", error);
      alert("Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromBasket = async (productId) => {
    setIsLoading(true); // Show loading indicator while processing
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      const response = await fetch(
        `http://wims-gateway.azure-api.net/bm/removefromBasket/${productId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        await fetchBasketData(); // Refresh the basket data after a product is removed
        // alert("Product removed successfully!");
      } else {
        throw new Error("Failed to remove product from basket");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error: " + error.message);
    } finally {
      setIsLoading(false); // Hide loading indicator after processing
    }
  };

  const fetchCategories = async () => {
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      const response = await fetch(
        "http://wims-gateway.azure-api.net/im/getAllCategories",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      setCategories(
        data.map((category) => ({ ...category, isChecked: false }))
      );
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const addToBasket = async (product) => {
    const body = JSON.stringify({
      products: [
        {
          id: product.id,
          productName: product.productName,
          productDescription: product.productDescription,
          price: product.price,
          quantity: 1, // This will always be 1 as per your requirement
        },
      ],
    });

    try {
      const token = await AsyncStorage.getItem("jwtToken");
      const response = await fetch(
        "http://wims-gateway.azure-api.net/bm/addToBasket",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: body,
        }
      );

      // console.log('response : ', response.ok);
      if (response.ok) {
        // alert("Product added to basket!");
      } else {
        throw new Error(result.message || "Failed to add to basket");
      }
    } catch (error) {
      console.error("Failed to add product to basket:", error);
      alert("Error: " + error.message);
    }
  };

  const fetchBasketData = async () => {
    const token = await AsyncStorage.getItem("jwtToken");
    try {
      const response = await fetch(
        "http://wims-gateway.azure-api.net/bm/getBasket",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // console.log("tkn = ", token);
      // console.log("RSP = ", response.ok);
      if (response.ok) {
        const jsonData = await response.json();
        setBasketData(jsonData);
      } else {
        // throw new Error("Failed to fetch basket data");
      }
    } catch (error) {
      console.error("Error:", error);
      setBasketData({ products: [] }); // Reset basket on error
    }
  };

  const fetchFilteredProducts = async () => {
    setIsLoading(true);
    let priceCondition =
      priceFilter.option === "less"
        ? `<=${priceFilter.amount}`
        : `>=${priceFilter.amount}`;
    let body = JSON.stringify({
      warehouseId: [],
      categoryId: Array.from(selectedCategories),
      price: priceCondition,
      quantity: "",
    });
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      const response = await fetch(
        "http://wims-gateway.azure-api.net/im/Warehouse/filter",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: body,
        }
      );
      const products = await response.json();
      setFilteredProducts(products);
    } catch (error) {
      console.error("Failed to fetch filtered products:", error);
      setFilteredProducts([]);
    }
    setIsLoading(false);
    setFilterModalVisible(false);
  };

  useEffect(() => {
    fetchFilteredProducts();
  }, []);

  useEffect(() => {
    if (modalVisible) {
      fetchBasketData();
    }
  }, [modalVisible]);

  const handleCategorySelection = (id) => {
    const newSet = new Set(selectedCategories);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedCategories(newSet);
  };

  const handleSwipeLeft = ({ nativeEvent }) => {
    if (nativeEvent.state === State.END && nativeEvent.translationX < -100) {
      navigation.navigate("ProfileScreen");
    }
  };

  useEffect(() => {
    if (modalVisible) {
      fetchBasketData();
    }
  }, [modalVisible]);

  return (
    <PanGestureHandler onHandlerStateChange={handleSwipeLeft}>
      <View style={{ flex: 1, backgroundColor: "#cedde4" }}>
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setModalVisible(true)}
        >
          <MaterialIcons name="shopping-cart" size={24} color="white" />
        </TouchableOpacity>
        <View
          style={{
            flexDirection: "row",
            marginTop: 60,
            paddingHorizontal: 20,
            alignItems: "center",
            backgroundColor: "#F0F0F0",
            padding: 15,
            borderRadius: 8,
            elevation: 2,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: "#333",
              flex: 1,
            }}
          >
            Warehouse Order App
          </Text>
          <TouchableOpacity onPress={() => setFilterModalVisible(true)}>
            <MaterialIcons name="filter-list" size={24} color="black" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator
            size="large"
            color="#0000ff"
            style={{ marginTop: 20 }}
          />
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.productContainer}>
                <Text style={styles.productName}>{item.productName}</Text>
                <Text>Description: {item.productDescription}</Text>
                <Text>Price: ${item.price.toFixed(2)}</Text>
                <TouchableOpacity
                  style={styles.addToBasketButton}
                  onPress={() => addToBasket(item)}
                >
                  <Text style={styles.addToBasketButtonText}>
                    Add to Basket
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
        <Modal
          animationType="slide"
          transparent={false}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}
        >
          <View style={styles.modalView}>
            <Text style={styles.modalText}>YOUR BASKET:</Text>
            <ScrollView>
              {isLoading ? (
                <ActivityIndicator size="large" color="#0000ff" />
              ) : basketData.products?.length > 0 ? (
                basketData.products.map((product, index) => (
                  <View key={product.id} style={styles.productContainer}>
                    <Text style={styles.productName}>
                      {product.productName}
                    </Text>
                    <Text>Description: {product.productDescription}</Text>
                    <Text>Price: ${product.price.toFixed(2)}</Text>
                    <Text>Quantity: {product.quantity}</Text>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeFromBasket(product.id)}
                    >
                      <Text style={styles.removeButtonText}>
                        Remove from Basket
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={styles.centeredMessage}>
                  <Text style={styles.emptyBasketText}>Basket is empty</Text>
                </View>
              )}
              <TouchableOpacity style={styles.button} onPress={createOrder}>
                <Text style={styles.buttonText}>Create Order</Text>
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setModalVisible(!modalVisible)}
            >
              <Text>Close</Text>
            </TouchableOpacity>
          </View>
        </Modal>
        <Modal
          animationType="slide"
          transparent={false}
          visible={filterModalVisible}
          onRequestClose={() => {
            setFilterModalVisible(!filterModalVisible);
          }}
        >
          <SafeAreaView style={styles.modalView}>
            <ScrollView style={styles.scrollView}>
              <Text style={styles.modalText}>Filter Products:</Text>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Max Price:</Text>
                <View style={styles.filterOptions}>
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      priceFilter.option === "less"
                        ? styles.optionButtonActive
                        : {},
                    ]}
                    onPress={() =>
                      setPriceFilter((prev) => ({
                        ...prev,
                        option: "less",
                      }))
                    }
                  >
                    <Text style={styles.optionButtonText}>Less Than</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      priceFilter.option === "greater"
                        ? styles.optionButtonActive
                        : {},
                    ]}
                    onPress={() =>
                      setPriceFilter((prev) => ({
                        ...prev,
                        option: "greater",
                      }))
                    }
                  >
                    <Text style={styles.optionButtonText}>Greater Than</Text>
                  </TouchableOpacity>
                </View>
                <Picker
                  selectedValue={priceFilter.amount}
                  onValueChange={(itemValue) =>
                    setPriceFilter((prev) => ({
                      ...prev,
                      amount: itemValue,
                    }))
                  }
                  style={styles.picker}
                >
                  {Array.from({ length: 19 }, (_, i) => i * 5 + 10).map(
                    (value) => (
                      <Picker.Item
                        key={value}
                        label={`$${value}`}
                        value={`${value}`}
                      />
                    )
                  )}
                </Picker>
              </View>

              <View style={[styles.section, styles.categorySection]}>
                <Text style={styles.sectionTitle}>Categories:</Text>
                {categories.map((category) => (
                  <View key={category.id} style={styles.checkboxContainer}>
                    <Checkbox
                      value={selectedCategories.has(category.categoryId)}
                      onValueChange={() =>
                        handleCategorySelection(category.categoryId)
                      }
                      color={
                        selectedCategories.has(category.categoryId)
                          ? "#4630EB"
                          : undefined
                      }
                    />
                    <Text>{category.categoryName}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={styles.button}
                onPress={() => fetchFilteredProducts()}
              >
                <Text>Apply Filters</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  modalView: {
    flex: 1,
    paddingTop: 42,
  },
  scrollView: {
    marginHorizontal: 20,
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  categorySection: {
    marginTop: 130, // Additional space above the categories section
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 10,
    margin: 10,
    marginBottom: 30,
    borderRadius: 5,
  },
  productContainer: {
    backgroundColor: "#e0e0e0",
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  filterOptions: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  optionButton: {
    padding: 10,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  optionButtonActive: {
    backgroundColor: "#2196F3",
  },
  optionButtonText: {
    color: "black",
  },
  picker: {
    width: "100%",
    height: 44,
  },
  floatingButton: {
    position: "absolute",
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    right: 30,
    bottom: 30,
    backgroundColor: "#2196F3",
    borderRadius: 28,
    elevation: 8, // increase elevation for Android
    zIndex: 10, // ensure it's on top in iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  centeredMessage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginBottom: -550,
  },
  emptyBasketText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  addToBasketButton: {
    backgroundColor: "#818e97",
    padding: 10,
    margin: 10,
    borderRadius: 5,
  },
  addToBasketButtonText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
  removeButton: {
    backgroundColor: "#ff4444",
    padding: 10,
    margin: 10,
    borderRadius: 5,
  },
  removeButtonText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#818e97",
    padding: 10,
    margin: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
});

export default HomeScreen;
