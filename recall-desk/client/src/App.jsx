import { useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  Grid,
  Group,
  Select,
  Stack,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconDatabaseImport } from '@tabler/icons-react';
import TopNav from './components/TopNav.jsx';
import CustomerChat from './components/CustomerChat.jsx';
import MemoryPanel from './components/MemoryPanel.jsx';
import MemoryActivity from './components/MemoryActivity.jsx';
import LearningTimeline from './components/LearningTimeline.jsx';
import RememberModal from './components/RememberModal.jsx';
import MemoryImpactPanel from './components/MemoryImpactPanel.jsx';
import CustomerAvatar from './components/CustomerAvatar.jsx';
import {
  customers,
  learningTimeline,
  memoriesByCustomer,
} from './data/mockData.js';
import {
  createMessageId,
  loadChatHistory,
  loadSelectedCustomerId,
  saveChatHistory,
  saveSelectedCustomerId,
} from './utils/chatStorage.js';

const API_BASE = 'http://localhost:3001';

function formatTime() {
  return new Date().toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function buildActivitySteps(data) {
  const recall = data?.memory?.recall;
  const retain = data?.memory?.retain;
  const count = recall?.count ?? data?.memoryCount ?? 0;
  const steps = [
    { id: 'received', label: '✓ Message received' },
    { id: 'searching', label: '✓ Searching Hindsight' },
  ];

  if (recall?.attempted && recall?.success) {
    steps.push({
      id: 'found',
      label: `✓ ${count} relevant memories found`,
    });
    if (count > 0) {
      steps.push({ id: 'used', label: '✓ Memory used' });
    }
  } else if (recall?.attempted) {
    steps.push({
      id: 'found-fail',
      label: '✕ Memory retrieval failed',
      failed: true,
    });
  }

  steps.push({ id: 'generated', label: '✓ Personalized response generated' });

  if (retain?.attempted && retain?.success) {
    steps.push({
      id: 'stored',
      label: '✓ Conversation saved to Hindsight',
    });
  } else if (retain?.attempted) {
    steps.push({
      id: 'stored-fail',
      label: '✕ Conversation not saved to Hindsight',
      failed: true,
    });
  }

  return steps;
}

function customerOptionLabel(c) {
  return `${c.name} · ${c.scenario}`;
}

function App() {
  const defaultCustomer =
    customers.find((c) => c.id === loadSelectedCustomerId(customers[0].id)) ||
    customers[0];

  const [selectedCustomerId, setSelectedCustomerId] = useState(
    defaultCustomer.id
  );
  const [messages, setMessages] = useState(() =>
    loadChatHistory(defaultCustomer.id)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [memoryTransparency, setMemoryTransparency] = useState(null);
  const [memoryAction, setMemoryAction] = useState(null);
  const [activitySteps, setActivitySteps] = useState([]);
  const [activityDone, setActivityDone] = useState(false);
  const [activityIndex, setActivityIndex] = useState(-1);
  const [rememberOpened, { open: openRemember, close: closeRemember }] =
    useDisclosure(false);
  const [memoryProfile, setMemoryProfile] = useState(null);
  const [memoryLoading, setMemoryLoading] = useState(false);
  const [memoryError, setMemoryError] = useState('');
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedStatus, setSeedStatus] = useState(null);

  const selectedCustomer = useMemo(
    () =>
      customers.find((c) => c.id === selectedCustomerId) || customers[0],
    [selectedCustomerId]
  );

  const panelMemory =
    memoriesByCustomer[selectedCustomer.id] || memoriesByCustomer['sarah-wilson'];

  async function handleLoadDemoData() {
    setSeedLoading(true);
    setSeedStatus(null);

    try {
      const res = await fetch(`${API_BASE}/api/demo/seed`, { method: 'POST' });
      const data = await res.json();

      if (!res.ok && res.status !== 207) {
        throw new Error(data.error || 'Failed to load demo data');
      }

      setSeedStatus({
        ok: Boolean(data.success),
        message:
          data.message ||
          (data.success
            ? 'Demo data loaded.'
            : 'Demo data load finished with errors.'),
        summary: data.summary,
      });
    } catch (err) {
      setSeedStatus({
        ok: false,
        message: err.message || 'Could not load demo data',
      });
    } finally {
      setSeedLoading(false);
    }
  }

  async function handleOpenRemember() {
    openRemember();
    setMemoryLoading(true);
    setMemoryError('');
    setMemoryProfile(null);

    try {
      const res = await fetch(
        `${API_BASE}/api/memory/${encodeURIComponent(selectedCustomer.id)}`
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load customer memories');
      }

      setMemoryProfile(data);
    } catch (err) {
      setMemoryError(err.message || 'Failed to load customer memories');
    } finally {
      setMemoryLoading(false);
    }
  }

  function switchCustomer(nextId) {
    if (!nextId || nextId === selectedCustomerId) return;

    saveChatHistory(selectedCustomerId, messages);
    saveSelectedCustomerId(nextId);

    setSelectedCustomerId(nextId);
    setMessages(loadChatHistory(nextId));
    setMemoryTransparency(null);
    setMemoryAction(null);
    setActivitySteps([]);
    setActivityDone(false);
    setActivityIndex(-1);
    setError('');
    setMemoryProfile(null);
    setMemoryError('');
    closeRemember();
  }

  async function handleSend(text) {
    const timestamp = new Date().toISOString();
    const userMessage = {
      id: createMessageId('user'),
      role: 'user',
      content: text,
      time: formatTime(),
      timestamp,
    };

    const withUser = [...messages, userMessage];
    setMessages(withUser);
    saveChatHistory(selectedCustomer.id, withUser);

    setLoading(true);
    setError('');
    setMemoryTransparency(null);
    setMemoryAction(null);
    setActivityDone(false);
    setActivityIndex(0);
    setActivitySteps([
      { id: 'received', label: '✓ Message received' },
      { id: 'searching', label: '✓ Searching Hindsight' },
    ]);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          message: text,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Chat request failed');
      }

      const steps = buildActivitySteps(data);
      setActivitySteps(steps);
      setActivityIndex(steps.length - 1);
      setActivityDone(true);

      setMemoryTransparency({
        memories: data.memories || data.memory?.recall?.memories || [],
        memoryCount:
          data.memoryCount ??
          data.memory?.recall?.count ??
          (data.memories || []).length,
        failed: Boolean(
          data.memoryRetrievalFailed ||
            (data.memory?.recall?.attempted && !data.memory?.recall?.success)
        ),
        retainSuccess: Boolean(data.memory?.retain?.success),
      });
      setMemoryAction(data.memoryAction || null);

      const assistantMessage = {
        id: createMessageId('assistant'),
        role: 'assistant',
        content: data.response,
        time: formatTime(),
        timestamp: new Date().toISOString(),
      };

      const withAssistant = [...withUser, assistantMessage];
      setMessages(withAssistant);
      saveChatHistory(selectedCustomer.id, withAssistant);
    } catch (err) {
      setError(err.message || 'Could not reach the support API.');
      setMemoryAction(null);
      setActivitySteps([
        { id: 'received', label: '✓ Message received' },
        { id: 'searching', label: '✓ Searching Hindsight' },
        {
          id: 'failed',
          label: '✕ Response generation failed',
          failed: true,
        },
      ]);
      setActivityDone(true);

      const assistantMessage = {
        id: createMessageId('assistant'),
        role: 'assistant',
        content:
          'Sorry — I could not complete that request right now. Please try again.',
        time: formatTime(),
        timestamp: new Date().toISOString(),
      };
      const withAssistant = [...withUser, assistantMessage];
      setMessages(withAssistant);
      saveChatHistory(selectedCustomer.id, withAssistant);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box mih="100vh" style={{ background: 'var(--rd-bg)' }}>
      <TopNav />

      <Box
        component="main"
        px={{ base: 'md', md: 'xl' }}
        py={{ base: 'md', md: 'lg' }}
        maw={1280}
        mx="auto"
      >
        <Stack gap="md">
          <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
            <div>
              <Group gap="sm" mb={8} wrap="nowrap">
                <CustomerAvatar
                  customerId={selectedCustomer.id}
                  name={selectedCustomer.name}
                  size={36}
                />
                <div>
                  <Text size="sm" c="dimmed" mb={2}>
                    Demo customer
                  </Text>
                  <Text
                    size="sm"
                    fw={600}
                    style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
                  >
                    {selectedCustomer.name}
                  </Text>
                </div>
              </Group>
              <Select
                aria-label="Select demo customer"
                data={customers.map((c) => ({
                  value: c.id,
                  label: customerOptionLabel(c),
                }))}
                value={selectedCustomerId}
                onChange={switchCustomer}
                allowDeselect={false}
                w={{ base: '100%', sm: 320 }}
                renderOption={({ option }) => {
                  const customer = customers.find((c) => c.id === option.value);
                  return (
                    <Group gap="sm" wrap="nowrap">
                      <CustomerAvatar
                        customerId={option.value}
                        name={customer?.name || option.label}
                        size={28}
                      />
                      <Text size="sm">{option.label}</Text>
                    </Group>
                  );
                }}
              />
              <Group gap={6} mt={8} wrap="wrap">
                <Badge size="sm" variant="light" color="gray">
                  {selectedCustomer.scenario}
                </Badge>
                <Badge size="sm" variant="light" color="teal">
                  Solved via {selectedCustomer.previousSolution}
                </Badge>
                <Badge size="sm" variant="outline" color="orange">
                  Open: {selectedCustomer.unresolvedIssue}
                </Badge>
              </Group>
              <Text size="xs" c="dimmed" mt={6}>
                Prefers {selectedCustomer.preference}
              </Text>
            </div>

            <Stack gap={6} align="flex-end">
              <Button
                color="teal"
                variant="light"
                leftSection={<IconDatabaseImport size={16} />}
                loading={seedLoading}
                onClick={handleLoadDemoData}
              >
                Load Demo Data
              </Button>
              <Text size="xs" c="dimmed" ta="right" maw={280}>
                Seeds Hindsight memories for all three demo customers
                (idempotent — no duplicates).
              </Text>
            </Stack>
          </Group>

          {seedStatus && (
            <Alert
              color={seedStatus.ok ? 'teal' : 'red'}
              variant="light"
              title={seedStatus.ok ? 'Demo data ready' : 'Demo data failed'}
            >
              {seedStatus.message}
              {seedStatus.summary && (
                <Text size="xs" mt={4} c="dimmed">
                  Seeded {seedStatus.summary.seeded}, skipped{' '}
                  {seedStatus.summary.skipped}, failed{' '}
                  {seedStatus.summary.failed}
                </Text>
              )}
            </Alert>
          )}

          {error && (
            <Alert color="red" variant="light" title="Request issue">
              {error}
            </Alert>
          )}

          <Grid gutter="md">
            <Grid.Col span={{ base: 12, md: 8 }}>
              <CustomerChat
                key={selectedCustomer.id}
                customer={selectedCustomer}
                messages={messages}
                loading={loading}
                onSend={handleSend}
                onOpenRemember={handleOpenRemember}
                memoryTransparency={memoryTransparency}
                memoryAction={memoryAction}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <MemoryPanel memory={panelMemory} />
            </Grid.Col>
          </Grid>

          <Grid gutter="md">
            <Grid.Col span={{ base: 12, md: 7 }}>
              <MemoryActivity
                steps={
                  activitySteps.length
                    ? activitySteps
                    : [{ id: 'idle', label: 'Waiting for a message' }]
                }
                activeIndex={activityIndex}
                completed={activityDone}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 5 }}>
              <LearningTimeline items={learningTimeline} />
            </Grid.Col>
          </Grid>

          <MemoryImpactPanel
            customer={selectedCustomer}
            apiBase={API_BASE}
          />
        </Stack>
      </Box>

      <RememberModal
        opened={rememberOpened}
        onClose={closeRemember}
        customerId={selectedCustomer.id}
        customerName={selectedCustomer.name}
        loading={memoryLoading}
        error={memoryError}
        profile={memoryProfile}
      />
    </Box>
  );
}

export default App;
