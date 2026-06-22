import { setStoreStorage } from "@helu/stores/persist";
import AsyncStorage from "@react-native-async-storage/async-storage";

const asyncStorageAdapter = {
    getItem: (key: string) => AsyncStorage.getItem(key),
    setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
    removeItem: (key: string) => AsyncStorage.removeItem(key),
};

setStoreStorage(asyncStorageAdapter);
