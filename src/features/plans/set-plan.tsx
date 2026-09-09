import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { FontFamily, Palette, Section } from '@/constants/theme';
import { createPlan } from './api';

const EMERALD = Section.groups.color;

function defaultWhen(): Date {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
}

function formatWhen(d: Date): string {
  return d.toLocaleString('en-IE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

type Props = {
  visible: boolean;
  groupId: string;
  userId: string;
  onCreated: () => void;
  onCancel: () => void;
};

export function SetPlan({ visible, groupId, userId, onCreated, onCancel }: Props) {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [details, setDetails] = useState('');
  const [when, setWhen] = useState<Date>(defaultWhen);
  const [iosPicker, setIosPicker] = useState(false);
  const [androidStage, setAndroidStage] = useState<'date' | 'time' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setTitle('');
    setLocation('');
    setDetails('');
    setWhen(defaultWhen());
    setError(null);
  }

  function openPicker() {
    if (Platform.OS === 'android') setAndroidStage('date');
    else setIosPicker((v) => !v);
  }

  function onAndroidChange(event: DateTimePickerEvent, picked?: Date) {
    if (event.type === 'dismissed' || !picked) {
      setAndroidStage(null);
      return;
    }
    const next = new Date(when);
    if (androidStage === 'date') {
      next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
      setWhen(next);
      setAndroidStage('time');
    } else {
      next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
      setWhen(next);
      setAndroidStage(null);
    }
  }

  async function submit() {
    if (!title.trim()) {
      setError('Give the plan a title.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createPlan(groupId, userId, {
        title: title.trim(),
        details: details.trim() || null,
        location: location.trim() || null,
        startsAt: when.toISOString(),
      });
      reset();
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not set the plan.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.grab} />
          <Text style={styles.heading}>Set the next plan</Text>

          <Text style={styles.label}>What</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Sunday hike · Ticknock"
            placeholderTextColor={Palette.inkSoft}
            editable={!busy}
          />

          <Text style={styles.label}>When</Text>
          <Pressable style={styles.when} onPress={openPicker} disabled={busy}>
            <Text style={styles.whenText}>{formatWhen(when)}</Text>
          </Pressable>
          {iosPicker && Platform.OS === 'ios' ? (
            <DateTimePicker
              value={when}
              mode="datetime"
              display="inline"
              minimumDate={new Date()}
              onChange={(_e, d) => d && setWhen(d)}
            />
          ) : null}
          {androidStage ? (
            <DateTimePicker
              value={when}
              mode={androidStage}
              minimumDate={androidStage === 'date' ? new Date() : undefined}
              onChange={onAndroidChange}
            />
          ) : null}

          <Text style={styles.label}>Where (optional)</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="The Lower Deck"
            placeholderTextColor={Palette.inkSoft}
            editable={!busy}
          />

          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            style={styles.input}
            value={details}
            onChangeText={setDetails}
            placeholder="Coffee after · all paces welcome"
            placeholderTextColor={Palette.inkSoft}
            editable={!busy}
          />

          <Pressable
            onPress={submit}
            disabled={busy}
            style={({ pressed }) => [styles.create, (busy || pressed) && styles.pressed]}>
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.createText}>Set plan</Text>
            )}
          </Pressable>
          <Pressable onPress={onCancel} disabled={busy} style={styles.cancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(27,20,48,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Palette.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 34,
  },
  grab: {
    width: 40,
    height: 4,
    borderRadius: 100,
    backgroundColor: Palette.line,
    alignSelf: 'center',
    marginBottom: 14,
  },
  heading: {
    fontFamily: FontFamily.display,
    color: Palette.ink,
    fontSize: 20,
  },
  label: {
    fontFamily: FontFamily.bodySemiBold,
    color: Palette.ink,
    fontSize: 13,
    marginTop: 14,
    marginBottom: 7,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Palette.line,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontFamily: FontFamily.body,
    fontSize: 15,
    color: Palette.ink,
    backgroundColor: Palette.card,
  },
  when: {
    borderWidth: 1.5,
    borderColor: Palette.line,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 13,
    backgroundColor: Palette.card,
  },
  whenText: { fontFamily: FontFamily.bodyMedium, color: Palette.ink, fontSize: 15 },
  create: {
    backgroundColor: EMERALD,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    minHeight: 50,
  },
  pressed: { opacity: 0.85 },
  createText: {
    fontFamily: FontFamily.bodySemiBold,
    color: '#FFFFFF',
    fontSize: 15,
  },
  cancel: { paddingVertical: 12, alignItems: 'center' },
  cancelText: {
    fontFamily: FontFamily.bodyMedium,
    color: Palette.inkSoft,
    fontSize: 13,
  },
  error: {
    fontFamily: FontFamily.bodyMedium,
    color: Palette.coral,
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
  },
});
