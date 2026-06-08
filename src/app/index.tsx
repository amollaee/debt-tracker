// app/index.tsx
import { useData } from '@/contexts/DataContext';
import { formatNumber } from '@/utils/helpers';
import * as FileSystem from 'expo-file-system';
import { router, useNavigation } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function PersonsScreen() {
  const { persons, addPerson, updatePerson, deletePerson, importData } = useData();
  const navigation = useNavigation();

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [newName, setNewName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => setBackupModalVisible(true)} style={{ marginRight: 15 }}>
          <Text style={{ fontSize: 22, color: '#fff' }}>⚙️</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const exportData = async () => {
    setLoading(true);
    try {
      const dataStr = JSON.stringify(persons, null, 2);
      const fileName = `debt_backup_${Date.now()}.json`;
      const filePath = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(filePath, dataStr, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath);
      } else {
        alert('اشتراک‌گذاری در این دستگاه پشتیبانی نمی‌شود');
      }
    } catch (error) {
      alert('خطا در ایجاد فایل پشتیبان');
    } finally {
      setLoading(false);
      setBackupModalVisible(false);
    }
  };

  const importFromFile = async () => {
    alert('برای بازیابی، کتابخانه expo-document-picker نیاز است. در حال حاضر فقط خروجی گرفتن فعال است.');
    setBackupModalVisible(false);
  };

  const calculateBalance = (transactions: any[]) => {
    let debtor = 0, creditor = 0;
    transactions.forEach(t => {
      if (t.type === 'debtor') debtor += t.amount;
      else creditor += t.amount;
    });
    return { debtor, creditor, balance: creditor - debtor };
  };

  const filteredPersons = persons.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddPerson = () => {
    if (!newName.trim()) return;
    addPerson(newName.trim());
    setNewName('');
    setAddModalVisible(false);
  };

  const handleEditPerson = () => {
    if (!newName.trim() || !selectedPerson) return;
    updatePerson(selectedPerson.id, newName.trim());
    setEditModalVisible(false);
    setSelectedPerson(null);
    setNewName('');
  };

  const handleDeletePerson = () => {
    if (selectedPerson) {
      deletePerson(selectedPerson.id);
      setDeleteModalVisible(false);
      setSelectedPerson(null);
    }
  };

  const openEditModal = (person: any) => {
    setSelectedPerson(person);
    setNewName(person.name);
    setEditModalVisible(true);
  };

  const openDeleteModal = (person: any) => {
    setSelectedPerson(person);
    setDeleteModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="🔍 جستجوی نام شخص..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        textAlign="right"
      />

      <FlatList
        data={filteredPersons}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const { debtor, creditor, balance } = calculateBalance(item.transactions);
          return (
            <Pressable
              style={styles.personCard}
              onPress={() => router.push(`/person/${item.id}`)}
              onLongPress={() => openEditModal(item)}
              delayLongPress={300}
            >
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{item.name}</Text>
                <Text style={styles.personStats}>
                  💸 بدهی: {formatNumber(debtor)}  |  💰 طلب: {formatNumber(creditor)}
                </Text>
                <Text style={[styles.personBalance, balance >= 0 ? styles.positive : styles.negative]}>
                  📊 تراز: {formatNumber(Math.abs(balance))} ({balance >= 0 ? 'طلبکار' : 'بدهکار'})
                </Text>
              </View>
              <TouchableOpacity style={styles.deleteButton} onPress={() => openDeleteModal(item)}>
                <Text style={styles.deleteIcon}>🗑️</Text>
              </TouchableOpacity>
            </Pressable>
          );
        }}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>هیچ شخصی یافت نشد</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setAddModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* مودال افزودن */}
      <Modal visible={addModalVisible} animationType="slide" transparent onRequestClose={() => setAddModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>➕ افزودن شخص جدید</Text>
            <TextInput style={styles.input} placeholder="نام کامل" value={newName} onChangeText={setNewName} textAlign="right" />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setAddModalVisible(false)}><Text style={styles.cancelText}>لغو</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleAddPerson}><Text style={styles.saveText}>افزودن</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* مودال ویرایش */}
      <Modal visible={editModalVisible} animationType="slide" transparent onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>✏️ ویرایش نام شخص</Text>
            <TextInput style={styles.input} placeholder="نام جدید" value={newName} onChangeText={setNewName} textAlign="right" />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisible(false)}><Text style={styles.cancelText}>لغو</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleEditPerson}><Text style={styles.saveText}>ذخیره</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* مودال حذف */}
      <Modal visible={deleteModalVisible} animationType="fade" transparent onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>⚠️ حذف شخص</Text>
            <Text style={styles.deleteConfirmText}>آیا از حذف «{selectedPerson?.name}» مطمئن هستید؟</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setDeleteModalVisible(false)}><Text style={styles.cancelText}>لغو</Text></TouchableOpacity>
              <TouchableOpacity style={styles.deleteConfirmButton} onPress={handleDeletePerson}><Text style={styles.deleteConfirmButtonText}>حذف</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* مودال پشتیبان‌گیری */}
      <Modal visible={backupModalVisible} animationType="fade" transparent onRequestClose={() => setBackupModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>⚙️ پشتیبان‌گیری</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.saveButton} onPress={exportData}><Text style={styles.saveText}>خروجی گرفتن (Export)</Text></TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setBackupModalVisible(false)}><Text style={styles.cancelText}>لغو</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 10,
    margin: 12,
    fontSize: 16,
    textAlign: 'right',
    writingDirection:'rtl'
  },
  listContent: { paddingBottom: 80 },
  personCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 3,
    paddingVertical:12,
    marginHorizontal: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
  },
  personInfo: { flex: 1 },
  personName: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', textAlign: 'right', marginBottom: 6 },
  personStats: { fontSize: 15, color: '#555', textAlign: 'right', marginBottom: 4, fontWeight:600},
  personBalance: { fontSize: 15, fontWeight: '600', textAlign: 'right' },
  deleteButton: { padding: 8, marginLeft: 8 },
  deleteIcon: { fontSize: 20, color: '#ef4444' },
  positive: { color: '#10b981' },
  negative: { color: '#ef4444' },
  fab: {
    position: 'absolute',
    bottom: 100,   // فاصله ثابت از پایین، بدون نیاز به SafeArea
    right: 20,
    backgroundColor: '#3b82f6',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  fabText: { fontSize: 28, color: '#fff', fontWeight: 'bold', lineHeight: 32 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '85%', backgroundColor: '#fff', borderRadius: 24, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, marginBottom: 12, fontSize: 16, textAlign: 'right' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelButton: { flex: 1, backgroundColor: '#f1f5f9', padding: 12, borderRadius: 12, alignItems: 'center' },
  cancelText: { color: '#475569' },
  saveButton: { flex: 1, backgroundColor: '#3b82f6', padding: 12, borderRadius: 12, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: 'bold' },
  deleteConfirmText: { fontSize: 16, textAlign: 'center', marginVertical: 20 },
  deleteConfirmButton: { flex: 1, backgroundColor: '#ef4444', padding: 12, borderRadius: 12, alignItems: 'center' },
  deleteConfirmButtonText: { color: '#fff', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#94a3b8', fontSize: 16 },
  loadingOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
});