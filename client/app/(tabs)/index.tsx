import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Button,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";

export default function App() {
  const [category, setCategory] = useState(null);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

  // Predefined categories for the dropdown
  const categories = [
    { label: "Food", value: "Food" },
    { label: "Transport", value: "Transport" },
    { label: "Entertainment", value: "Entertainment" },
    { label: "Shopping", value: "Shopping" },
    { label: "Health", value: "Health" },
    { label: "Other", value: "Other" },
  ];

  // Load saved expenses from AsyncStorage when the component mounts
  useEffect(() => {
    const loadExpenses = async () => {
      try {
        const storedExpenses = await AsyncStorage.getItem("expenses");
        if (storedExpenses !== null) {
          setExpenses(JSON.parse(storedExpenses));
        }
      } catch (error) {
        console.log("Error loading expenses:", error);
      }
    };

    loadExpenses();
  }, []);

  // Save expenses to AsyncStorage
  const saveExpenses = async (newExpenses: { id: string; category: never; amount: number; date: string; }[]) => {
    try {
      await AsyncStorage.setItem("expenses", JSON.stringify(newExpenses));
    } catch (error) {
      console.log("Error saving expenses:", error);
    }
  };

  // Clear all expenses from AsyncStorage
  const clearExpenses = async () => {
    try {
      await AsyncStorage.removeItem("expenses");
      setExpenses([]);
      Alert.alert("Success", "All expenses have been cleared.");
    } catch (error) {
      console.log("Error clearing expenses:", error);
    }
  };

  // Add expense with validation
  const addExpense = () => {
    // Validate category
    if (!category) {
      Alert.alert("Error", "Please select a category.");
      return;
    }

    // Validate amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Error", "Please enter a valid amount.");
      return;
    }

    // Validate date
    if (!date) {
      Alert.alert("Error", "Please select a valid date.");
      return;
    }

    const newExpense = {
      id: Math.random().toString(),
      category,
      amount: parsedAmount,
      date, // Store date as ISO string
    };

    const updatedExpenses = [newExpense, ...expenses];
    setExpenses(updatedExpenses); // Update state
    saveExpenses(updatedExpenses); // Save to AsyncStorage

    // Clear input fields
    setCategory(null);
    setAmount("");
    setDate("");
  };

  // Function to group expenses by date and category
  const groupExpenses = () => {
    const grouped = expenses.reduce((acc, expense) => {
      const dateKey = new Date(expense.date).toLocaleDateString();
      if (!acc[dateKey]) {
        acc[dateKey] = {};
      }
      if (!acc[dateKey][expense.category]) {
        acc[dateKey][expense.category] = 0;
      }
      acc[dateKey][expense.category] += expense.amount;
      return acc;
    }, {});

    return Object.entries(grouped).map(([date, categories]) => ({
      date,
      categories: Object.entries(categories).map(([category, amount]) => ({
        category,
        amount,
      })),
    }));
  };

  const renderExpenseGroup = ({ item }) => (
    <View style={styles.expenseGroup}>
      <Text style={styles.expenseGroupDate}>{item.date}</Text>
      {item.categories.map((cat: { category: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; amount: number; }, index: React.Key | null | undefined) => (
        <View key={index} style={styles.expenseItem}>
          <Text style={styles.expenseText}>{cat.category}</Text>
          <Text style={styles.expenseText}>${cat.amount.toFixed(2)}</Text>
        </View>
      ))}
    </View>
  );

  const groupedExpenses = groupExpenses();

  const showDatePicker = () => {
    setIsDatePickerVisible(true);
  };

  const handleDateConfirm = (selectedDate: { toISOString: () => React.SetStateAction<string>; }) => {
    setDate(selectedDate.toISOString()); // Store the selected date as ISO string
    setIsDatePickerVisible(false);
  };

  const hideDatePicker = () => {
    setIsDatePickerVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Expense Tracker</Text>

      <View style={styles.inputContainer}>
        {/* Category Dropdown */}
        <DropDownPicker
          open={open}
          value={category}
          items={categories}
          setOpen={setOpen}
          setValue={setCategory}
          placeholder="Select Category"
          containerStyle={{ marginBottom: 10 }}
        />

        {/* Amount Input */}
        <TextInput
          placeholder="Amount"
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        {/* Date Picker as a clickable input field */}
        <TouchableOpacity onPress={showDatePicker}>
          <TextInput
            style={styles.input}
            placeholder="Pick a Date"
            value={date ? new Date(date).toLocaleDateString() : ""}
            editable={false} // Prevent manual input
          />
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleDateConfirm}
          onCancel={hideDatePicker}
        />

        <Button title="Add Expense" onPress={addExpense} />
      </View>

      <Text style={styles.subtitle}>Grouped Expenses by Date</Text>
      <FlatList
        data={groupedExpenses}
        keyExtractor={(item) => item.date}
        renderItem={renderExpenseGroup}
        ListEmptyComponent={<Text>No expenses recorded.</Text>}
      />

      {/* Reset Button */}
      <Button title="Clear All Expenses" onPress={clearExpenses} color="red" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    marginVertical: 10,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    color: "#333",
  },
  expenseGroup: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  expenseGroupDate: {
    fontSize: 18,
    fontWeight: "bold",
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 5,
  },
  expenseText: {
    fontSize: 16,
  },
});
