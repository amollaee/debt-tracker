// app/persons/[id].tsx
import { Transaction, useData } from '@/contexts/DataContext';
import { formatNumber, toEnglishNumber, toPersianDate } from '@/utils/helpers';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';


export default function PersonDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { persons, addTransaction, updateTransaction, deleteTransaction } = useData();
  const person = persons.find((p) => p.id === id);

  // state برای جستجو و فیلتر
  const [searchText, setSearchText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null); 
  const [amountRaw, setAmountRaw] = useState(''); // فقط عدد (انگلیسی)
  const [amountDisplay, setAmountDisplay] = useState(''); // نمایش با کاما و فارسی
  const [type, setType] = useState<'debtor' | 'creditor'>('debtor');
  const [description, setDescription] = useState('');

  // تنظیم عنوان صفحه به نام شخص
  useLayoutEffect(() => {
    if (person) {
      navigation.setOptions({ title: person.name });
    }
  }, [person, navigation]);

  // فیلتر تراکنش‌ها بر اساس توضیحات و بازه تاریخ
  const filteredTransactions = person?.transactions.filter(trans => {
    // جستجوی متن در توضیحات
    if (searchText && !trans.description.includes(searchText)) return false;
    // فیلتر تاریخ (ساده: مقایسه رشته‌ای YYYY-MM-DD)
    if (startDate) {
      const transDate = trans.createdAt.split('T')[0];
      if (transDate < startDate) return false;
    }
    if (endDate) {
      const transDate = trans.createdAt.split('T')[0];
      if (transDate > endDate) return false;
    }
    return true;
  }) || [];


  if (!person) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>شخص مورد نظر یافت نشد.</Text>
      </View>
    );
  }

  const totalDebtor = person.transactions.filter(t => t.type === 'debtor').reduce((s, t) => s + t.amount, 0);
  const totalCreditor = person.transactions.filter(t => t.type === 'creditor').reduce((s, t) => s + t.amount, 0);
  const balance = totalCreditor - totalDebtor;

  // مدیریت تغییرات فیلد مبلغ با فرمت زنده
  const handleAmountChange = (text: string) => {
    // ابتدا اعداد فارسی و جداکننده‌ها را حذف کرده و فقط ارقام انگلیسی نگه دار
    const onlyDigits = text.replace(/[^0-9۰-۹]/g, '');
    if (onlyDigits === '') {
      setAmountRaw('');
      setAmountDisplay('');
      return;
    }
    // تبدیل به عدد انگلیسی
    const englishNumber = toEnglishNumber(onlyDigits);
    const rawString = englishNumber.toString();
    setAmountRaw(rawString);
    // نمایش با کاما و فارسی
    setAmountDisplay(formatNumber(englishNumber));
  };

  const handleSaveTransaction = () => {
    const amountNum = parseInt(amountRaw, 10);
    if (isNaN(amountNum) || amountNum <= 0) return;
    if (editingTransaction) {
      updateTransaction(person.id, editingTransaction.id, {
        amount: amountNum,
        type,
        description: description.trim() || '-',
      });
    } else {
      addTransaction(person.id, {
        amount: amountNum,
        type,
        description: description.trim() || '-',
      });
    }
    setModalVisible(false);
    resetForm();
  };

  const handleDeleteTransaction = () => {
    if (selectedTransactionId) {
      deleteTransaction(person.id, selectedTransactionId);
      setDeleteModalVisible(false);
      setSelectedTransactionId(null);
    }
  };

  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    const raw = transaction.amount.toString();
    setAmountRaw(raw);
    setAmountDisplay(formatNumber(transaction.amount));
    setType(transaction.type);
    setDescription(transaction.description);
    setModalVisible(true);
  };

  const openDeleteModal = (transactionId: string) => {
    setSelectedTransactionId(transactionId);
    setDeleteModalVisible(true);
  };

  const resetForm = () => {
    setEditingTransaction(null);
    setAmountRaw('');
    setAmountDisplay('');
    setType('debtor');
    setDescription('');
  };

  return (
    <View style={styles.container}>
      {/* نمایش نام شخص (اختیاری، چون در هدر هم هست) */}
      {/* <Text style={styles.personNameHeader}>{person.name}</Text> */}

      {/* نوار جستجو و فیلتر تاریخ */}
      <View style={styles.filterContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="جستجو در توضیحات ..."
          value={searchText}
          onChangeText={setSearchText}
          textAlign="right"
        />
        {/* <View style={styles.dateRow}>
          <TextInput
            style={styles.dateInput}
            placeholder="از تاریخ (مثال: 1403/01/01)"
            value={startDate}
            onChangeText={setStartDate}
            textAlign="right"
          />
          <TextInput
            style={styles.dateInput}
            placeholder="تا تاریخ"
            value={endDate}
            onChangeText={setEndDate}
            textAlign="right"
          />
          <TouchableOpacity onPress={() => { setStartDate(''); setEndDate(''); setSearchText(''); }}>
            <Text style={styles.clearFilter}>✖️</Text>
          </TouchableOpacity>
        </View> */}
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryItem}>💸 بدهی: {formatNumber(totalDebtor)}</Text>
        <Text style={styles.summaryItem}>💰 طلب: {formatNumber(totalCreditor)}</Text>
        <Text style={[styles.summaryItemBalance, balance >= 0 ? styles.positive : styles.negative]}>
          📊 تراز: {formatNumber(Math.abs(balance))}
        </Text>
      </View>

      <FlatList
        data={person.transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.transCard}
            onLongPress={() => openEditModal(item)}
            delayLongPress={300}
          >
            <View style={styles.transLeft}>
              <Text style={[styles.transType, item.type === 'debtor' ? styles.debtorText : styles.creditorText]}>
                {item.type === 'debtor' ? 'بدهکار' : 'بستانکار'}
              </Text>
              <Text style={styles.transDesc}>{item.description}</Text>
              <Text style={styles.transDate}>{toPersianDate(item.createdAt)}</Text>
            </View>
            <View style={styles.transRight}>
              <Text style={styles.transAmount}>{formatNumber(item.amount)} تومان</Text>
              <TouchableOpacity onPress={() => openDeleteModal(item.id)} style={styles.deleteButton}>
                <Text style={styles.deleteText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>هیچ تراکنشی ثبت نشده است.</Text>}
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity style={styles.fab} onPress={() => {
        resetForm();
        setModalVisible(true);
      }}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* مودال افزودن/ویرایش تراکنش */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{editingTransaction ? '✏️ ویرایش تراکنش' : '➕ تراکنش جدید'}</Text>
            <TextInput
              style={styles.input}
              placeholder="مبلغ (تومان)"
              keyboardType="numeric"
              value={amountDisplay}
              onChangeText={handleAmountChange}
              textAlign="right"
            />
            <View style={styles.typeSwitch}>
              <TouchableOpacity
                style={[styles.typeButton, type === 'debtor' && styles.activeDebtor]}
                onPress={() => setType('debtor')}
              >
                <Text>💸 بدهکار</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, type === 'creditor' && styles.activeCreditor]}
                onPress={() => setType('creditor')}
              >
                <Text>💰 بستانکار</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="توضیحات (اختیاری)"
              value={description}
              onChangeText={setDescription}
              textAlign="right"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>لغو</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveTransaction}>
                <Text style={styles.saveText}>{editingTransaction ? 'ذخیره' : 'افزودن'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* مودال حذف تراکنش */}
      <Modal visible={deleteModalVisible} animationType="fade" transparent onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>⚠️ حذف تراکنش</Text>
            <Text style={styles.deleteConfirmText}>
              آیا از حذف این تراکنش مطمئن هستید؟
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.cancelText}>لغو</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteConfirmButton} onPress={handleDeleteTransaction}>
                <Text style={styles.deleteConfirmButtonText}>حذف</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  personNameHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 4,
    color: '#0f172a',
  },
  listContent: { padding: 12, paddingBottom: 80 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 16,
    elevation: 2,
    flexWrap: 'wrap',
    gap: 8,
    writingDirection:'rtl'
  },
  summaryItem: { fontSize: 13, fontWeight: '600', color: '#334155' },
  summaryItemBalance: { fontSize: 13, fontWeight: 'bold' },
  transCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transLeft: { flex: 2 },
  transType: { fontSize: 13, fontWeight: 'bold', marginBottom: 4 },
  transDesc: { fontSize: 12, color: '#64748b', marginBottom: 2 },
  transDate: { fontSize: 10, color: '#94a3b8' },
  transRight: { alignItems: 'flex-end', gap: 6 },
  transAmount: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  deleteButton: { padding: 6 },
  deleteText: { fontSize: 18, color: '#ef4444' },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#3b82f6',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    writingDirection:'rtl'
  },
  fabText: { fontSize: 28, color: '#fff', fontWeight: 'bold', lineHeight: 32 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '85%', backgroundColor: '#fff', borderRadius: 24, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, marginBottom: 12, fontSize: 16, textAlign: 'right' },
  typeSwitch: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  typeButton: { flex: 1, padding: 10, alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12 },
  activeDebtor: { backgroundColor: '#fee2e2', borderColor: '#f87171', borderWidth: 1 },
  activeCreditor: { backgroundColor: '#dcfce7', borderColor: '#4ade80', borderWidth: 1 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelButton: { flex: 1, backgroundColor: '#f1f5f9', padding: 12, borderRadius: 12, alignItems: 'center' },
  cancelText: { color: '#475569' },
  saveButton: { flex: 1, backgroundColor: '#3b82f6', padding: 12, borderRadius: 12, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: 'bold' },
  deleteConfirmText: { fontSize: 16, textAlign: 'center', marginVertical: 20 },
  deleteConfirmButton: { flex: 1, backgroundColor: '#ef4444', padding: 12, borderRadius: 12, alignItems: 'center' },
  deleteConfirmButtonText: { color: '#fff', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#94a3b8', fontSize: 16 },
  errorText: { textAlign: 'center', marginTop: 50, color: '#ef4444', fontSize: 18 },
  positive: { color: '#10b981' },
  negative: { color: '#ef4444' },
  debtorText: { color: '#e11d48' },
  creditorText: { color: '#16a34a' },
  // search
  filterContainer: {margin: 0 , backgroundColor:'#FFF', padding: 3, borderRadius: 4 },
  searchInput: { borderWidth: 1, color:'#999', borderColor: '#e2e8f0', borderRadius: 4, padding: 10, margin: 4, fontSize: 16, textAlign: 'right', writingDirection:'rtl' },
  dateRow: { flexDirection: 'column', alignItems: 'center', gap: 8 },
  dateInput: { flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 10, fontSize: 14, textAlign: 'right' },
  clearFilter: { fontSize: 20, padding: 8, color: '#ef4444' },
});