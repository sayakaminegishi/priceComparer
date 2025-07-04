// Import necessary components
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  Image,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator(); //creates a stack navigator instance

// the API key for serpAPI to fetch Google Shopping results
const SERP_API_KEY = '1d48eec5f044f15ea6500b824bde84322fa6029dff835e1d2f6f82668404e5e0';

// makes user input a search item and navigate to results
// navitation is used to switch screens
function SearchScreen({ navigation }) {
  const [query, setQuery] = useState(''); //tracks the user's search input

  const handleSearch = async () => {
    if (!query.trim()) return;  //ignore empty input
    await AsyncStorage.setItem('lastQuery', query); //save query to async storage
    navigation.navigate('Results', { query }); //go to results screen, passing the query as a parameter
  };

  useEffect(() => {
    const loadLastQuery = async () => {
      const last = await AsyncStorage.getItem('lastQuery');
      if (last) setQuery(last);
    };
    loadLastQuery(); //pre-fill the search box with the last searched item if it exists
  }, []);

  // style text input and serach button
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter item name:</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. iPhone"
        value={query}
        onChangeText={setQuery}
      />
      <Button title="Search" onPress={handleSearch} />
    </View>
  );
}

// Fetch and display product results 
function ResultsScreen({ route }) {
  //first retrieve the query passed from the search screen
  const { query } = route.params;
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

// sends a GET request to SerpAPI with the query (item name), parses JSON to extract the top 10 matching reuslts, and handle errors.
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(
          query
        )}&api_key=${SERP_API_KEY}`;

        const res = await fetch(url, {
          headers: {
            'User-Agent': 'ReactNativeApp/1.0',
          },
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.log('Non-OK response:', res.status, errorText);
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }

        const json = await res.json();
        console.log('Success response JSON:', json);

        const products = json.shopping_results || json.organic_results || [];
        setItems(products.slice(0, 10));
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message || 'Failed to fetch');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [query]);

  //loading and error messages
  if (loading) return <Text style={styles.loading}>Loading...</Text>;
  if (error) return <Text style={styles.error}>{error}</Text>;

  //display fetched products in a scrollable list using FlatList
  return (
    <FlatList
      data={items}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Image source={{ uri: item.thumbnail || item.image }} style={styles.image} />
          <Text style={{ fontWeight: 'bold' }}>{item.title}</Text>
          <Text>{item.price || item.price_text}</Text>
          <Text style={{ fontSize: 12, color: 'gray' }}>{item.source}</Text>
        </View>
      )}
    />
  );
}

// sets up navitation between the Search and Results screens via React Navigation
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="Results" component={ResultsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

//styling
const styles = StyleSheet.create({
  container: { padding: 20, flex: 1 },
  title: { fontSize: 18, marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  card: {
    padding: 10,
    margin: 10,
    backgroundColor: '#eee',
    borderRadius: 10,
  },
  image: {
    height: 100,
    width: 100,
    resizeMode: 'contain',
  },
  loading: { padding: 20 },
  error: { color: 'red', padding: 20 },
});
