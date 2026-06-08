import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const STORAGE_KEY = '@debt_list';

// تبدیل عدد به فارسی
const toPersianNumber = (num) => {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

// نمایش تاریخ شمسی به صورت فارسی
const formatPersianDate = (isoString) => {
  const date = new Date(isoString);
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  const persianDate = new Intl.DateTimeFormat('fa-IR', options).format(date);
  return persianDate.replace(/\d/g, (d) => toPersianNumber(d));
};

export default function App() {
  const [persons, setPersons] = useState([]);

  // مودال افزودن
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addName, setAddName] = useState('');
  const [addAmount, setAddAmount] = useState('');
  const [addType, setAddType] = useState('debtor');

  // مودال ویرایش
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState('debtor');

  // مودال تأیید حذف
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [personToDelete, setPersonToDelete] = useState(null);

  // جستجو و مرتب‌سازی
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => { loadData(); }, []);
  useEffect(() => { saveData(persons); }, [persons]);

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setPersons(JSON.parse(stored));
    } catch (error) { console.error(error); }
  };

  const saveData = async (data) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) { console.error(error); }
  };

  const addPerson = () => {
    if (!addName.trim()) { alert('لطفاً نام را وارد کنید'); return; }
    const amountNum = parseFloat(addAmount);
    if (isNaN(amountNum)) { alert('مبلغ را به درستی وارد کنید'); return; }
    const newPerson = {
      id: Date.now().toString(),
      name: addName.trim(),
      amount: amountNum,
      type: addType,
      createdAt: new Date().toISOString(),
    };
    setPersons([newPerson, ...persons]);
    setAddModalVisible(false);
    setAddName('');
    setAddAmount('');
    setAddType('debtor');
  };

  // نمایش مودال حذف
  const confirmDelete = (person) => {
    setPersonToDelete(person);
    setDeleteModalVisible(true);
  };

  // اجرای حذف
  const handleDelete = () => {
    if (personToDelete) {
      setPersons(prev => prev.filter(p => p.id !== personToDelete.id));
      setDeleteModalVisible(false);
      setPersonToDelete(null);
    }
  };

  const openEditModal = (person) => {
    setEditingPerson(person);
    setEditName(person.name);
    setEditAmount(person.amount.toString());
    setEditType(person.type);
    setEditModalVisible(true);
  };

  const saveEdit = () => {
    if (!editName.trim()) { alert('نام نمی‌تواند خالی باشد'); return; }
    const amountNum = parseFloat(editAmount);
    if (isNaN(amountNum)) { alert('مبلغ صحیح وارد کنید'); return; }
    const updatedPersons = persons.map(p =>
      p.id === editingPerson.id
        ? { ...p, name: editName.trim(), amount: amountNum, type: editType, updatedAt: new Date().toISOString() }
        : p
    );
    setPersons(updatedPersons);
    setEditModalVisible(false);
    setEditingPerson(null);
  };

  const filteredPersons = persons.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const getSortedPersons = () => {
    const filtered = [...filteredPersons];
    let sorted = [];
    switch (sortBy) {
      case 'name': sorted = filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'amount': sorted = filtered.sort((a, b) => a.amount - b.amount); break;
      case 'type': sorted = filtered.sort((a, b) => a.type.localeCompare(b.type)); break;
      case 'date': sorted = filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
      default: sorted = filtered;
    }
    if (sortOrder === 'desc') sorted.reverse();
    return sorted;
  };
  const sortedPersons = getSortedPersons();

  const totalDebtor = persons.filter(p => p.type === 'debtor').reduce((s, p) => s + p.amount, 0);
  const totalCreditor = persons.filter(p => p.type === 'creditor').reduce((s, p) => s + p.amount, 0);
  const balance = totalCreditor - totalDebtor;

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Pressable
        style={styles.itemLeft}
        onLongPress={() => openEditModal(item)}
        android_ripple={{ color: '#e2e8f0', borderless: false }}
      >
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={[styles.itemType, item.type === 'debtor' ? styles.debtorText : styles.creditorText]}>
          {item.type === 'debtor' ? 'بدهکار' : 'بستانکار'}
        </Text>
        <Text style={styles.itemDate}>{formatPersianDate(item.createdAt)}</Text>
      </Pressable>

      <View style={styles.itemRight}>
        <Text style={styles.itemAmount}>{toPersianNumber(item.amount.toLocaleString())} تومان</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={() => openEditModal(item)} style={styles.editButton}>
            <Text style={styles.editText}>✏️</Text>
          </TouchableOpacity>
          <Pressable onPress={() => confirmDelete(item)} style={styles.deleteButton} hitSlop={8}>
            <Text style={styles.deleteText}>🗑️</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  const SortButton = ({ title, sortKey }) => (
    <TouchableOpacity
      style={[styles.sortButton, sortBy === sortKey && styles.activeSort]}
      onPress={() => {
        if (sortBy === sortKey) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        else { setSortBy(sortKey); setSortOrder('asc'); }
      }}
    >
      <Text style={styles.sortButtonText}>
        {title} {sortBy === sortKey && (sortOrder === 'asc' ? '▲' : '▼')}
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      <StatusBar hidden />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryItem}>💸 بدهی: {toPersianNumber(totalDebtor.toLocaleString())} تومان</Text>
            <Text style={styles.summaryItem}>💰 طلب: {toPersianNumber(totalCreditor.toLocaleString())} تومان</Text>
            <Text style={[styles.summaryItemBalance, balance >= 0 ? styles.positive : styles.negative]}>
              📊 تراز: {toPersianNumber(balance.toLocaleString())}
            </Text>
          </View>
        </View>

        <View style={styles.searchSortContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 جستجو در نام‌ها..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
          <View style={styles.sortRow}>
            <SortButton title="نام" sortKey="name" />
            <SortButton title="مبلغ" sortKey="amount" />
            <SortButton title="نوع" sortKey="type" />
            <SortButton title="تاریخ" sortKey="date" />
          </View>
        </View>

        <FlatList
          data={sortedPersons}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>📭 هنوز کسی ثبت نشده</Text>}
        />

        <TouchableOpacity style={styles.fab} onPress={() => setAddModalVisible(true)}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>

        {/* مودال افزودن */}
        <Modal visible={addModalVisible} animationType="slide" transparent onRequestClose={() => setAddModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>➕ افزودن شخص جدید</Text>
              <TextInput style={styles.input} placeholder="نام" value={addName} onChangeText={setAddName} />
              <TextInput style={styles.input} placeholder="مبلغ (تومان)" keyboardType="numeric" value={addAmount} onChangeText={setAddAmount} />
              <View style={styles.typeSwitch}>
                <TouchableOpacity style={[styles.typeButton, addType === 'debtor' && styles.activeDebtor]} onPress={() => setAddType('debtor')}>
                  <Text>💸 بدهکار</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.typeButton, addType === 'creditor' && styles.activeCreditor]} onPress={() => setAddType('creditor')}>
                  <Text>💰 بستانکار</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setAddModalVisible(false)}><Text style={styles.cancelText}>لغو</Text></TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={addPerson}><Text style={styles.saveText}>افزودن</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* مودال ویرایش */}
        <Modal visible={editModalVisible} animationType="slide" transparent onRequestClose={() => setEditModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>✏️ ویرایش شخص</Text>
              <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholder="نام" />
              <TextInput style={styles.input} value={editAmount} onChangeText={setEditAmount} keyboardType="numeric" placeholder="مبلغ" />
              <View style={styles.typeSwitch}>
                <TouchableOpacity style={[styles.typeButton, editType === 'debtor' && styles.activeDebtor]} onPress={() => setEditType('debtor')}>
                  <Text>بدهکار</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.typeButton, editType === 'creditor' && styles.activeCreditor]} onPress={() => setEditType('creditor')}>
                  <Text>بستانکار</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisible(false)}><Text style={styles.cancelText}>لغو</Text></TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={saveEdit}><Text style={styles.saveText}>ذخیره</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* مودال تأیید حذف */}
        <Modal visible={deleteModalVisible} animationType="fade" transparent onRequestClose={() => setDeleteModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>⚠️ حذف شخص</Text>
              <Text style={styles.deleteConfirmText}>
                آیا از حذف «{personToDelete?.name}» مطمئن هستید؟
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setDeleteModalVisible(false)}>
                  <Text style={styles.cancelText}>لغو</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteConfirmButton} onPress={handleDelete}>
                  <Text style={styles.deleteConfirmButtonText}>حذف</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    writingDirection: 'rtl',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 16,
    shadowOpacity: 0.03,
    elevation: 2,
  },
  summaryText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#334155',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  summaryTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 6,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  positive: { color: '#10b981' },
  negative: { color: '#ef4444' },
  searchSortContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    flexWrap: 'wrap',
  },
  sortButton: {
    flex: 1,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  activeSort: { backgroundColor: '#cbd5e1' },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingBottom: 80,
  },
  itemContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  itemLeft: {
    flex: 2,
    paddingVertical: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  itemType: {
    fontSize: 12,
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  debtorText: { color: '#e11d48' },
  creditorText: { color: '#16a34a' },
  itemDate: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: { padding: 4 },
  deleteButton: { padding: 4 },
  editText: { fontSize: 18 },
  deleteText: { fontSize: 18 },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#94a3b8',
    fontSize: 16,
    writingDirection: 'rtl',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#3b82f6',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  fabText: { fontSize: 28, color: '#fff', fontWeight: 'bold', lineHeight: 32 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  typeSwitch: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  activeDebtor: { backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#f87171' },
  activeCreditor: { backgroundColor: '#dcfce7', borderWidth: 1, borderColor: '#4ade80' },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: { color: '#475569' },
  saveButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: 'bold' },
  deleteConfirmText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
    writingDirection: 'rtl',
  },
  deleteConfirmButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteConfirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryItem: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  summaryItemBalance: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});