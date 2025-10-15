import { useState } from "react";
import { View, TextInput, FlatList, Text, TouchableOpacity } from "react-native";

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");

  const addTask = () => {
    if (!input.trim()) return;
    setTasks([...tasks, { id: Date.now().toString(), text: input }]);
    setInput("");
  };

  return (
    <View style={{ width: "100%" }}>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 10,
          padding: 10,
          marginBottom: 10,
        }}
        placeholder="Add a new task..."
        value={input}
        onChangeText={setInput}
      />
      <TouchableOpacity
        style={{
          backgroundColor: "#007AFF",
          padding: 10,
          borderRadius: 10,
          marginBottom: 15,
          alignItems: "center",
        }}
        onPress={addTask}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>Add Task</Text>
      </TouchableOpacity>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "#f2f2f2",
              padding: 10,
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            <Text>{item.text}</Text>
          </View>
        )}
      />
    </View>
  );
}
