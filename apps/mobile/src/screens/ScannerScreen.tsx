import { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Linking, Image, ScrollView, TextInput } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { X, Check, RefreshCw, Sparkles, ChevronDown } from "lucide-react-native";
import { uploadFileFromUri, createDocument, getDocumentTypes, getTagCategories, classifyDocumentFromUri, createCustomTag, type DocumentCreate, type DocumentTypeOut, type TagCategoryOut } from "@healthguard/api";


export function ScannerScreen() {
  const queryClient = useQueryClient();
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [catalogs, setCatalogs] = useState<{ types: DocumentTypeOut[]; tags: TagCategoryOut[] }>({ types: [], tags: [] });
  
  // Selection state
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [newTagValues, setNewTagValues] = useState<Record<string, string>>({});
  const [addingTag, setAddingTag] = useState<string | null>(null); // categoryId

  const cameraRef = useRef<CameraView>(null);
  const navigation = useNavigation<any>();

  useEffect(() => {
    async function fetchCatalogs() {
      try {
        const [types, tags] = await Promise.all([
          getDocumentTypes(),
          getTagCategories()
        ]);
        setCatalogs({ types, tags });
      } catch (err) {
        console.warn("Error fetching catalogs", err);
      }
    }
    fetchCatalogs();
  }, []);

  useEffect(() => {
    if (photoUri && !title) {
      setTitle(`Escaneo ${new Date().toLocaleDateString()}`);
    }
  }, [photoUri]);

  async function handleRequestPermission() {
    if (!permission) {
      Alert.alert("Error", "El sistema de permisos no está listo.");
      return;
    }

    // If already denied permanently
    if (!permission.canAskAgain && permission.status === "denied") {
      Alert.alert(
        "Cámara Bloqueada",
        "El acceso a la cámara está desactivado en la configuración de tu celular. ¿Quieres ir a activarlo?",
        [
          { text: "No", style: "cancel" },
          { text: "Sí, abrir ajustes", onPress: () => Linking.openSettings() }
        ]
      );
      return;
    }

    try {
      // For 'undetermined' or 'denied' (if canAskAgain is true), we request
      const response = await requestPermission();
      
      if (!response.granted) {
        if (!response.canAskAgain) {
          Alert.alert(
            "Permiso necesario",
            "Para usar la cámara, debes activarla en los ajustes del sistema.",
            [{ text: "Abrir ajustes", onPress: () => Linking.openSettings() }, { text: "Cerrar" }]
          );
        } else {
          Alert.alert("Aviso", "Necesitamos el permiso para poder escanear tus documentos.");
        }
      }
    } catch (err) {
      console.error("Error in handleRequestPermission:", err);
      Alert.alert("Error técnico", "No pudimos solicitar el permiso: " + String(err));
    }
  }

  if (!permission) {
    return <View style={styles.center}><ActivityIndicator color="#0ea5e9" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Necesitamos permiso para usar la cámara</Text>
        <TouchableOpacity style={styles.btn} onPress={handleRequestPermission}>
          <Text style={styles.btnText}>
            {!permission.canAskAgain && permission.status === "denied"
              ? "Abrir ajustes"
              : "Conceder permiso"}
          </Text>
        </TouchableOpacity>
        {!permission.canAskAgain && (
          <Text style={styles.helper}>
            Parece que el permiso fue denegado permanentemente. Ve a los ajustes del dispositivo y habilita la cámara para esta app.
          </Text>
        )}
      </View>
    );
  }

  async function takePicture() {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo) setPhotoUri(photo.uri);
    }
  }

  async function handleClassify() {
    if (!photoUri || classifying) return;
    try {
      setClassifying(true);
      const fileName = "classification-input.jpg";
      
      const { storagePath } = await uploadFileFromUri(photoUri, fileName, "image/jpeg");
      
      const result = await classifyDocument({ fileUrl: storagePath } as any);
      
      if (result) {
        if (result.title) setTitle(result.title);
        if (result.typeId) {
          setSelectedType(result.typeId);
          if (result.specialtyId) setSelectedSpecialty(result.specialtyId);
        }
        if (result.tagValueIds) setSelectedTags(result.tagValueIds);
      }
    } catch (err) {
      console.warn("Error clasificando documento", err);
      Alert.alert("IA no disponible", "No pudimos clasificar el documento automáticamente.");
    } finally {
      setClassifying(false);
    }
  }

  async function handleUpload() {
    if (!photoUri || uploading) return;
    
    const MAX_RETRIES = 3;
    let attempt = 0;
    
    setUploading(true);

    while (attempt < MAX_RETRIES) {
      try {
        const fileName = `scan-${Date.now()}.jpg`;
        const { storagePath } = await uploadFileFromUri(photoUri, fileName, "image/jpeg");

        const today = new Date();
        const docPayload: any = {
          title: title || `Escaneo ${today.toLocaleDateString()}`,
          fileUrl: storagePath,
          format: "image/jpeg",
          file_size_bytes: 0,
          documentDate: today.toISOString(),
          typeId: selectedType,
          subtypeIds: [],
          specialtyIds: selectedSpecialty ? [selectedSpecialty] : [],
          tagValueIds: selectedTags,
        };

        await createDocument(docPayload);
        queryClient.invalidateQueries({ queryKey: ["documents"] });
        navigation.goBack();
        return; // Success
      } catch (err: any) {
        attempt++;
        console.warn(`Intento ${attempt} fallido:`, err);
        
        if (attempt >= MAX_RETRIES) {
          let detail = err.message || "Ha ocurrido un error inesperado";
          if (err.fieldErrors) {
            detail = Object.entries(err.fieldErrors)
              .map(([f, m]) => `${f}: ${m}`)
              .join("\n");
          }
          Alert.alert("Error de subida", detail);
        }
      }
    }
    setUploading(false);
  }

  async function handleAIClassify() {
    if (!photoUri || classifying) return;
    try {
      setClassifying(true);
      const fileName = "classification-input.jpg";
      
      // Use the new mobile-friendly helper
      const result = await classifyDocumentFromUri(photoUri, fileName, "image/jpeg");
      
      if (result) {
        if (result.title) setTitle(result.title);
        if (result.type?.id) {
          setSelectedType(result.type.id);
        }
        
        // Select suggested custom tags
        if (result.custom_tags && result.custom_tags.length > 0) {
          const tagIds = result.custom_tags.map((ct: any) => ct.tag_value_id);
          setSelectedTags(prev => [...new Set([...prev, ...tagIds])]);
          
          // Refresh tags catalog to see the names if they were auto-created
          const tags = await getTagCategories();
          setCatalogs(prev => ({ ...prev, tags }));
        }
      }
    } catch (err) {
      console.warn("Error classifying with AI", err);
      Alert.alert("IA no disponible", "No pudimos clasificar el documento automáticamente.");
    } finally {
      setClassifying(false);
    }
  }

  async function handleAddCustomTag(categoryId: string) {
    const value = newTagValues[categoryId];
    if (!value?.trim() || addingTag) return;

    try {
      setAddingTag(categoryId);
      const newTag = await createCustomTag({ categoryId, value });
      
      // Update catalog
      const tags = await getTagCategories();
      setCatalogs(prev => ({ ...prev, tags }));
      
      // Select the new tag
      setSelectedTags(prev => [...prev, newTag.id]);
      
      // Clear input
      setNewTagValues(prev => ({ ...prev, [categoryId]: "" }));
    } catch (err) {
      console.warn("Error creating custom tag", err);
      Alert.alert("Error", "No se pudo crear la etiqueta personalizada.");
    } finally {
      setAddingTag(null);
    }
  }

  if (photoUri) {
    const currentType = catalogs.types.find(t => t.id === selectedType);

    return (
      <View style={styles.container}>
        <ScrollView style={{ flex: 1 }}>
          <View style={styles.previewContainer}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="contain" />
          </View>
          
          <View style={styles.form}>
            <Text style={styles.formTitle}>Clasificar Documento</Text>
            
            <TouchableOpacity 
              style={[styles.aiBtn, classifying && { opacity: 0.7 }]} 
              onPress={handleAIClassify} 
              disabled={classifying}
            >
              <Sparkles color="#fff" size={20} />
              <Text style={styles.aiBtnText}>{classifying ? "Clasificando..." : "Clasificar con IA"}</Text>
            </TouchableOpacity>

            <View style={styles.field}>
              <Text style={styles.label}>Título del Documento</Text>
              <TextInput 
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Ej. Resultados Laboratorio"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Tipo de Documento</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {catalogs.types.map(t => (
                  <TouchableOpacity 
                    key={t.id} 
                    style={[styles.chip, selectedType === t.id && styles.chipActive]} 
                    onPress={() => {
                      setSelectedType(t.id);
                      setSelectedSpecialty(undefined);
                    }}
                  >
                    <Text style={[styles.chipText, selectedType === t.id && styles.chipTextActive]}>{t.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {currentType && currentType.specialties.length > 0 && (
              <View style={styles.field}>
                <Text style={styles.label}>Especialidad</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {currentType.specialties.map(s => (
                    <TouchableOpacity 
                      key={s.id} 
                      style={[styles.chip, selectedSpecialty === s.id && styles.chipActive]} 
                      onPress={() => setSelectedSpecialty(s.id)}
                    >
                      <Text style={[styles.chipText, selectedSpecialty === s.id && styles.chipTextActive]}>{s.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {catalogs.tags.map(category => (
              <View key={category.id} style={styles.field}>
                <Text style={styles.label}>{category.name}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {category.values.map(val => (
                    <TouchableOpacity 
                      key={val.id} 
                      style={[styles.chip, selectedTags.includes(val.id) && styles.chipActive]} 
                      onPress={() => {
                        if (selectedTags.includes(val.id)) {
                          setSelectedTags(selectedTags.filter(id => id !== val.id));
                        } else {
                          setSelectedTags([...selectedTags, val.id]);
                        }
                      }}
                    >
                      <Text style={[styles.chipText, selectedTags.includes(val.id) && styles.chipTextActive]}>{val.value}</Text>
                    </TouchableOpacity>
                  ))}
                  
                  {/* Add New Tag Inline */}
                  <View style={styles.addTagContainer}>
                    <TextInput
                      style={styles.addTagInput}
                      placeholder="Nueva..."
                      placeholderTextColor="#94a3b8"
                      value={newTagValues[category.id] || ""}
                      onChangeText={(text) => setNewTagValues(prev => ({ ...prev, [category.id]: text }))}
                      onSubmitEditing={() => handleAddCustomTag(category.id)}
                    />
                    <TouchableOpacity 
                      style={styles.addTagBtn} 
                      onPress={() => handleAddCustomTag(category.id)}
                      disabled={addingTag === category.id}
                    >
                      {addingTag === category.id ? (
                        <ActivityIndicator size="small" color="#0ea5e9" />
                      ) : (
                        <Text style={styles.addTagBtnText}>+</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            ))}
          </View>
        </ScrollView>
        
        <View style={styles.previewControls}>
          <TouchableOpacity style={styles.circleBtnRed} onPress={() => setPhotoUri(null)} disabled={uploading}>
            <X color="#fff" size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.circleBtnGreen} onPress={handleUpload} disabled={uploading}>
            {uploading ? <ActivityIndicator color="#fff" /> : <Check color="#fff" size={32} />}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" ref={cameraRef} />
      
      <View style={styles.overlay}>
        <View style={styles.cameraHeader}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <X color="#fff" size={24} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.cameraControls}>
          <View style={{ width: 64 }} /> {/* Spacer */}
          <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
            <View style={styles.captureBtnInner} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.switchBtn}>
            <RefreshCw color="#fff" size={24} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff", padding: 24 },
  text: { fontSize: 16, color: "#334155", textAlign: "center", marginBottom: 16 },
  btn: { backgroundColor: "#0ea5e9", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: "#fff", fontWeight: "600" },
  
  container: { flex: 1, backgroundColor: "#000" },
  overlay: { flex: 1, justifyContent: "space-between" },
  cameraHeader: { padding: 24, paddingTop: 48, alignItems: "flex-start" },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  
  cameraControls: { flexDirection: "row", padding: 32, paddingBottom: 48, justifyContent: "space-between", alignItems: "center" },
  captureBtn: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: "#fff", alignItems: "center", justifyContent: "center" },
  captureBtnInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#fff" },
  switchBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  
  previewContainer: { height: 450, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  previewImage: { width: "100%", height: "100%" },
  
  form: { padding: 20, backgroundColor: "#fff", flex: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24 },
  formTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a", marginBottom: 16 },
  
  aiBtn: { backgroundColor: "#8b5cf6", flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 12, borderRadius: 12, marginBottom: 24, gap: 8 },
  aiBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  
  input: { backgroundColor: "#f1f5f9", padding: 12, borderRadius: 12, fontSize: 16, color: "#0f172a", borderWidth: 1, borderColor: "#e2e8f0" },
  
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#64728b", marginBottom: 8 },
  chipScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: "#f1f5f9", marginRight: 8, borderWidth: 1, borderColor: "#e2e8f0" },
  chipActive: { backgroundColor: "#0ea5e9", borderColor: "#0ea5e9" },
  chipText: { fontSize: 13, color: "#475569", fontWeight: "600" },
  chipTextActive: { color: "#fff" },

  addTagContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 999, paddingLeft: 12, paddingRight: 4, borderWidth: 1, borderColor: "#e2e8f0", height: 36, marginLeft: 4 },
  addTagInput: { fontSize: 13, color: "#0f172a", width: 80, padding: 0 },
  addTagBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", marginLeft: 4 },
  addTagBtnText: { color: "#0ea5e9", fontSize: 18, fontWeight: "bold" },
 
  previewControls: { flexDirection: "row", justifyContent: "center", gap: 32, paddingBottom: 48, backgroundColor: "#fff", paddingTop: 12 },
  circleBtnRed: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#ef4444", alignItems: "center", justifyContent: "center" },
  circleBtnGreen: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#22c55e", alignItems: "center", justifyContent: "center" },
  helper: { marginTop: 16, fontSize: 13, color: "#64728b", textAlign: "center", lineHeight: 18 },
});
