import { Buffer } from "buffer";
import "react-native-get-random-values";

// Import our complete crypto polyfill
import "./lib/crypto/init";

// Then import the expo router
import "expo-router/entry";

// Ensure Buffer is available globally
global.Buffer = Buffer;
