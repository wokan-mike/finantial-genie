import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Platform, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCreditCards } from '../hooks/useCreditCards';
import { useTheme, getThemeColors } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatters';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import CreditCardForm from '../components/forms/CreditCardForm';
import { CreditCardSchema } from '../services/database/schema';
import Card from '../components/common/Card';
import { toTitleCase } from '../utils/textHelpers';
import { isDesktop, getCardPadding } from '../utils/responsive';
import { useStatementProcessor } from '../hooks/useStatementProcessor';
import { getLastCutDate } from '../services/calculations/creditCardExpenses';
import { format, parseISO, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ExtractedTransaction } from '../services/statementProcessor';
import { DEFAULT_CATEGORIES } from '../utils/categories';
import Button from '../components/common/Button';

export default function CreditCards() {
  const navigation = useNavigation<any>();
  const { creditCards, loading, deleteCreditCard, refresh } = useCreditCards();
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCardSchema | null>(null);
  
  // Statement upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCardForUpload, setSelectedCardForUpload] = useState<CreditCardSchema | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extractedTransactions, setExtractedTransactions] = useState<ExtractedTransaction[]>([]);
  const [duplicateResults, setDuplicateResults] = useState<Map<number, any>>(new Map());
  
  const {
    processing,
    error: processingError,
    processStatementFile,
    checkAllDuplicates,
    saveTransactions,
  } = useStatementProcessor();

  const handleDeleteCard = async (id: string, name: string) => {
    const confirmMessage = `¿Estás seguro de eliminar la tarjeta "${name}"?`;
    let confirmed = false;
    
    if (Platform.OS === 'web') {
      confirmed = window.confirm(confirmMessage);
    } else {
      return;
    }
    
    if (confirmed) {
      try {
        await deleteCreditCard(id);
        showToast('Tarjeta eliminada correctamente', 'success');
        refresh();
      } catch (error) {
        showToast('Error al eliminar la tarjeta', 'error');
      }
    }
  };

  const handleEditCard = (card: CreditCardSchema) => {
    setEditingCard(card);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCard(null);
    refresh();
  };

  // Calculate billing period for selected card and month (only months, no specific dates)
  // Returns pair of months: previous month and selected month
  const getBillingPeriod = (card: CreditCardSchema, month: Date) => {
    // Get the previous month
    const previousMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1);
    
    // Get month names in Spanish
    const monthNames = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    
    const startMonthName = monthNames[previousMonth.getMonth()];
    const endMonthName = monthNames[month.getMonth()];
    
    return {
      startMonth: startMonthName,
      endMonth: endMonthName,
      startYear: previousMonth.getFullYear(),
      endYear: month.getFullYear(),
    };
  };

  // Handle upload button click
  const handleUploadStatement = (card: CreditCardSchema) => {
    setSelectedCardForUpload(card);
    setSelectedMonth(new Date());
    setPdfFile(null);
    setExtractedTransactions([]);
    setDuplicateResults(new Map());
    setShowUploadModal(true);
  };

  // Handle file selection
  const handleFileSelect = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/pdf,image/png,image/jpeg,image/jpg';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
          if (!validTypes.includes(file.type)) {
            showToast('Por favor selecciona un archivo PDF o imagen (PNG/JPG)', 'error');
            return;
          }
          setPdfFile(file);
          setExtractedTransactions([]);
          setDuplicateResults(new Map());
        }
      };
      input.click();
    } else {
      showToast('Funcionalidad no disponible en móvil aún', 'info');
    }
  };

  // Process statement
  const handleProcessStatement = async () => {
    if (!pdfFile || !selectedCardForUpload) {
      showToast('Por favor selecciona un archivo', 'error');
      return;
    }

    try {
      const billingPeriod = getBillingPeriod(selectedCardForUpload, selectedMonth);
      const result = await processStatementFile(
        pdfFile,
        selectedCardForUpload.id,
        billingPeriod
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to process statement');
      }

      setExtractedTransactions(result.transactions || []);
      showToast('Estado de cuenta procesado correctamente', 'success');
      
      // Automatically check for duplicates
      if (result.transactions && result.transactions.length > 0) {
        const results = await checkAllDuplicates(result.transactions, selectedCardForUpload.id);
        setDuplicateResults(results);
        
        const duplicateCount = Array.from(results.values()).filter(r => r.isDuplicate).length;
        if (duplicateCount > 0) {
          showToast(`${duplicateCount} transacciones duplicadas encontradas`, 'info');
        }
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al procesar estado de cuenta', 'error');
    }
  };

  // Save transactions
  const handleSaveTransactions = async () => {
    if (!selectedCardForUpload || extractedTransactions.length === 0) {
      showToast('No hay transacciones para guardar', 'error');
      return;
    }

    const nonDuplicates = extractedTransactions.filter((_, index) => {
      const result = duplicateResults.get(index);
      return !result?.isDuplicate;
    });

    if (nonDuplicates.length === 0) {
      showToast('Todas las transacciones son duplicados', 'info');
      return;
    }

    const confirmMessage = `¿Guardar ${nonDuplicates.length} transacciones nuevas?`;
    let confirmed = false;

    if (Platform.OS === 'web') {
      confirmed = window.confirm(confirmMessage);
    } else {
      Alert.alert('Confirmar', confirmMessage, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Guardar', onPress: () => { confirmed = true; } },
      ]);
    }

    if (!confirmed) return;

    try {
      const { saved, skipped } = await saveTransactions(
        extractedTransactions,
        selectedCardForUpload.id,
        duplicateResults
      );

      showToast(`${saved} transacciones guardadas, ${skipped} omitidas`, 'success');
      
      // Reset and close
      setShowUploadModal(false);
      setPdfFile(null);
      setExtractedTransactions([]);
      setDuplicateResults(new Map());
      setSelectedCardForUpload(null);
    } catch (err) {
      showToast('Error al guardar transacciones', 'error');
    }
  };

  // Month navigation
  const handlePreviousMonth = () => {
    setSelectedMonth(subMonths(selectedMonth, 1));
  };

  const handleNextMonth = () => {
    const nextMonth = subMonths(selectedMonth, -1);
    if (nextMonth <= new Date()) {
      setSelectedMonth(nextMonth);
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.surface,
    },
    header: {
      padding: spacing.lg,
      backgroundColor: themeColors.background,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    title: {
      ...typography.h1,
      color: themeColors.primary,
      fontWeight: '700',
      marginBottom: spacing.md,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.md,
    },
    cardName: {
      ...typography.h4,
      color: themeColors.text,
      fontWeight: '600',
      flex: 1,
    },
    cardActions: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    actionButton: {
      padding: spacing.sm,
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    editButton: {
      backgroundColor: themeColors.primary + '40',
    },
    deleteButton: {
      backgroundColor: themeColors.error + '40',
    },
    actionButtonText: {
      fontSize: 18,
    },
    cardDetails: {
      marginBottom: spacing.sm,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    detailLabel: {
      ...typography.caption,
      color: themeColors.textSecondary,
    },
    detailValue: {
      ...typography.bodySmall,
      color: themeColors.text,
      fontWeight: '600',
    },
    creditInfo: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
    },
    creditItem: {
      alignItems: 'center',
    },
    creditLabel: {
      ...typography.caption,
      color: themeColors.textSecondary,
      marginBottom: spacing.xs,
    },
    creditValue: {
      fontSize: isDesktop ? 18 : 16,
      fontWeight: '700',
    },
    available: {
      color: themeColors.accent,
    },
    used: {
      color: themeColors.secondary,
    },
    limit: {
      color: themeColors.text,
    },
    inactiveBadge: {
      backgroundColor: themeColors.textSecondary + '40',
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 8,
      alignSelf: 'flex-start',
      marginTop: spacing.xs,
    },
    inactiveText: {
      ...typography.caption,
      color: themeColors.textSecondary,
      fontWeight: '600',
    },
    emptyContainer: {
      padding: spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      ...typography.body,
      color: themeColors.textSecondary,
      fontStyle: 'italic',
    },
    addButton: {
      backgroundColor: themeColors.primary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: spacing.md,
    },
    addButtonText: {
      ...typography.body,
      color: themeColors.background,
      fontWeight: '600',
    },
  });

  const renderCard = ({ item }: { item: CreditCardSchema }) => {
    const usagePercentage = item.creditLimit > 0 
      ? (item.currentBalance / item.creditLimit) * 100 
      : 0;

    return (
      <Card padding={getCardPadding()} marginBottom={spacing.lg}>
        <View style={dynamicStyles.cardHeader}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 4,
                height: 40,
                backgroundColor: item.color || themeColors.primary,
                borderRadius: 2,
                marginRight: spacing.md,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.cardName}>{item.name}</Text>
              <Text style={dynamicStyles.detailLabel}>
                {item.bank} •••• {item.last4Digits}
              </Text>
            </View>
          </View>
          <View style={dynamicStyles.cardActions}>
            <TouchableOpacity
              style={[dynamicStyles.actionButton, { backgroundColor: themeColors.accent + '40' }]}
              onPress={() => handleUploadStatement(item)}
              activeOpacity={0.7}
            >
              <Text style={dynamicStyles.actionButtonText}>📄</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[dynamicStyles.actionButton, dynamicStyles.editButton]}
              onPress={() => handleEditCard(item)}
              activeOpacity={0.7}
            >
              <Text style={dynamicStyles.actionButtonText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[dynamicStyles.actionButton, dynamicStyles.deleteButton]}
              onPress={() => handleDeleteCard(item.id, item.name)}
              activeOpacity={0.7}
            >
              <Text style={dynamicStyles.actionButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={dynamicStyles.cardDetails}>
          <View style={dynamicStyles.detailRow}>
            <Text style={dynamicStyles.detailLabel}>Fecha de corte:</Text>
            <Text style={dynamicStyles.detailValue}>Día {item.cutDate}</Text>
          </View>
          <View style={dynamicStyles.detailRow}>
            <Text style={dynamicStyles.detailLabel}>Días para pagar:</Text>
            <Text style={dynamicStyles.detailValue}>{item.paymentDays} días</Text>
          </View>
          <View style={dynamicStyles.detailRow}>
            <Text style={dynamicStyles.detailLabel}>Tasa de interés:</Text>
            <Text style={dynamicStyles.detailValue}>{item.annualInterestRate}%</Text>
          </View>
          <View style={dynamicStyles.detailRow}>
            <Text style={dynamicStyles.detailLabel}>Tasa moratoria:</Text>
            <Text style={dynamicStyles.detailValue}>{item.moratoryInterestRate}%</Text>
          </View>
        </View>

        <View style={dynamicStyles.creditInfo}>
          <View style={dynamicStyles.creditItem}>
            <Text style={dynamicStyles.creditLabel}>Límite</Text>
            <Text style={[dynamicStyles.creditValue, dynamicStyles.limit]}>
              {formatCurrency(item.creditLimit)}
            </Text>
          </View>
          <View style={dynamicStyles.creditItem}>
            <Text style={dynamicStyles.creditLabel}>Usado</Text>
            <Text style={[dynamicStyles.creditValue, dynamicStyles.used]}>
              {formatCurrency(item.currentBalance)}
            </Text>
            <Text style={dynamicStyles.detailLabel}>
              ({usagePercentage.toFixed(1)}%)
            </Text>
          </View>
          <View style={dynamicStyles.creditItem}>
            <Text style={dynamicStyles.creditLabel}>Disponible</Text>
            <Text style={[dynamicStyles.creditValue, dynamicStyles.available]}>
              {formatCurrency(item.availableCredit)}
            </Text>
          </View>
        </View>

        {!item.isActive && (
          <View style={dynamicStyles.inactiveBadge}>
            <Text style={dynamicStyles.inactiveText}>{toTitleCase('Inactiva')}</Text>
          </View>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={[dynamicStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: themeColors.text }}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.title}>Tarjetas de Crédito</Text>
        <TouchableOpacity
          style={dynamicStyles.addButton}
          onPress={() => {
            setEditingCard(null);
            setShowForm(true);
          }}
        >
          <Text style={dynamicStyles.addButtonText}>+ Agregar Tarjeta</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={creditCards}
        renderItem={renderCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={dynamicStyles.emptyContainer}>
            <Text style={dynamicStyles.emptyText}>
              No hay tarjetas registradas
            </Text>
            <Text style={[dynamicStyles.emptyText, { marginTop: spacing.sm }]}>
              Agrega una tarjeta para comenzar
            </Text>
          </View>
        }
      />

      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseForm}
      >
        <CreditCardForm
          onClose={handleCloseForm}
          card={editingCard || undefined}
        />
      </Modal>

      {/* Statement Upload Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={[dynamicStyles.container, { padding: spacing.lg }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
            <Text style={[dynamicStyles.title, { marginBottom: 0 }]}>
              {toTitleCase('Subir Estado de Cuenta')}
            </Text>
            <TouchableOpacity
              onPress={() => setShowUploadModal(false)}
              style={{
                padding: spacing.sm,
                borderRadius: 20,
                backgroundColor: themeColors.background,
              }}
            >
              <Text style={{ fontSize: 24 }}>✕</Text>
            </TouchableOpacity>
          </View>

          {selectedCardForUpload && (
            <>
              {/* Card Info */}
              <Card padding={getCardPadding()} marginBottom={spacing.md}>
                <Text style={[dynamicStyles.cardName, { marginBottom: spacing.xs }]}>
                  {selectedCardForUpload.name}
                </Text>
                {(() => {
                  const billingPeriod = getBillingPeriod(selectedCardForUpload, selectedMonth);
                  return billingPeriod ? (
                    <Text style={dynamicStyles.detailLabel}>
                      Período: {billingPeriod.startMonth} {billingPeriod.startYear} a {billingPeriod.endMonth} {billingPeriod.endYear}
                    </Text>
                  ) : null;
                })()}
              </Card>

              {/* Month Selection */}
              <Card padding={getCardPadding()} marginBottom={spacing.md}>
                <Text style={[dynamicStyles.detailLabel, { marginBottom: spacing.sm }]}>
                  Mes del Estado de Cuenta
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <TouchableOpacity
                    onPress={handlePreviousMonth}
                    disabled={processing}
                    style={{ padding: spacing.sm }}
                  >
                    <Text style={dynamicStyles.cardName}>‹</Text>
                  </TouchableOpacity>
                  <Text style={dynamicStyles.cardName}>
                    {format(selectedMonth, 'MMMM yyyy')}
                  </Text>
                  <TouchableOpacity
                    onPress={handleNextMonth}
                    disabled={processing || subMonths(selectedMonth, -1) > new Date()}
                    style={{ padding: spacing.sm }}
                  >
                    <Text style={dynamicStyles.cardName}>›</Text>
                  </TouchableOpacity>
                </View>
              </Card>

              {/* File Upload */}
              <Card padding={getCardPadding()} marginBottom={spacing.md}>
                <Text style={[dynamicStyles.detailLabel, { marginBottom: spacing.sm }]}>
                  Seleccionar Archivo
                </Text>
                <TouchableOpacity
                  onPress={handleFileSelect}
                  style={{
                    padding: spacing.md,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: themeColors.border,
                    borderStyle: 'dashed',
                    alignItems: 'center',
                    marginBottom: spacing.md,
                  }}
                >
                  <Text style={dynamicStyles.detailLabel}>
                    {pdfFile ? '📄 Archivo seleccionado' : '📎 Seleccionar PDF o Imagen'}
                  </Text>
                  {pdfFile && (
                    <Text style={[dynamicStyles.cardName, { marginTop: spacing.xs, fontSize: 12 }]}>
                      {pdfFile.name} ({(pdfFile.size / 1024).toFixed(1)} KB)
                    </Text>
                  )}
                </TouchableOpacity>
                <Button
                  title="Procesar Estado de Cuenta"
                  onPress={handleProcessStatement}
                  disabled={!pdfFile || processing}
                  variant="primary"
                />
                {processing && (
                  <View style={{ marginTop: spacing.md, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={themeColors.primary} />
                    <Text style={[dynamicStyles.detailLabel, { marginTop: spacing.xs }]}>
                      Procesando con IA...
                    </Text>
                  </View>
                )}
                {processingError && (
                  <Text style={{ color: themeColors.secondary, marginTop: spacing.sm, ...typography.caption }}>
                    Error: {processingError}
                  </Text>
                )}
              </Card>

              {/* Extracted Transactions */}
              {extractedTransactions.length > 0 && (
                <Card padding={getCardPadding()} marginBottom={spacing.md}>
                  <Text style={[dynamicStyles.cardName, { marginBottom: spacing.md }]}>
                    {toTitleCase('Transacciones Extraídas')} ({extractedTransactions.length})
                  </Text>
                  <ScrollView style={{ maxHeight: 300, marginBottom: spacing.md }}>
                    {extractedTransactions.map((txn, index) => {
                      const duplicateResult = duplicateResults.get(index);
                      const isDuplicate = duplicateResult?.isDuplicate;
                      const category = DEFAULT_CATEGORIES.find(c => c.name === txn.category);
                      return (
                        <View
                          key={index}
                          style={{
                            padding: spacing.sm,
                            borderRadius: 8,
                            marginBottom: spacing.xs,
                            backgroundColor: isDuplicate ? themeColors.secondary + '20' : themeColors.accent + '10',
                            borderLeftWidth: 4,
                            borderLeftColor: isDuplicate ? themeColors.secondary : themeColors.accent,
                          }}
                        >
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={[dynamicStyles.cardName, { flex: 1, fontSize: 14 }]} numberOfLines={1}>
                              {category?.icon} {txn.description}
                            </Text>
                            <Text style={[dynamicStyles.cardName, { color: themeColors.primary }]}>
                              {formatCurrency(txn.amount)}
                            </Text>
                            {isDuplicate && (
                              <View style={{
                                backgroundColor: themeColors.secondary,
                                paddingHorizontal: spacing.xs,
                                paddingVertical: 2,
                                borderRadius: 4,
                                marginLeft: spacing.xs,
                              }}>
                                <Text style={{ ...typography.caption, color: themeColors.background, fontSize: 10 }}>
                                  DUP
                                </Text>
                              </View>
                            )}
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs }}>
                            <Text style={dynamicStyles.detailLabel}>
                              {format(parseISO(txn.date), 'dd MMM yyyy')}
                            </Text>
                            <Text style={dynamicStyles.detailLabel}>{txn.category}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md }}>
                    <Text style={dynamicStyles.detailLabel}>
                      Total: {formatCurrency(extractedTransactions.reduce((sum, txn) => sum + txn.amount, 0))}
                    </Text>
                    <View>
                      <Text style={[dynamicStyles.detailLabel, { color: themeColors.accent }]}>
                        Nuevas: {extractedTransactions.filter((_, i) => !duplicateResults.get(i)?.isDuplicate).length}
                      </Text>
                      <Text style={[dynamicStyles.detailLabel, { color: themeColors.secondary }]}>
                        Duplicados: {extractedTransactions.filter((_, i) => duplicateResults.get(i)?.isDuplicate).length}
                      </Text>
                    </View>
                  </View>
                  <Button
                    title={`Guardar ${extractedTransactions.filter((_, i) => !duplicateResults.get(i)?.isDuplicate).length} Transacciones`}
                    onPress={handleSaveTransactions}
                    disabled={extractedTransactions.filter((_, i) => !duplicateResults.get(i)?.isDuplicate).length === 0}
                    variant="primary"
                  />
                </Card>
              )}
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.md,
  },
});
