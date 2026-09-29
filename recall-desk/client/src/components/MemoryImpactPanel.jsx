import { useState } from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconSparkles } from '@tabler/icons-react';

const DEFAULT_MESSAGE = 'My payment failed again.';

function ResponseCard({ title, eyebrow, body, accent, memories }) {
  return (
    <Paper
      radius="lg"
      p="md"
      withBorder
      style={{
        borderColor: accent.border,
        background: accent.background,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div>
        <Text
          size="xs"
          fw={700}
          tt="uppercase"
          style={{ letterSpacing: '0.06em' }}
          c={accent.label}
        >
          {eyebrow}
        </Text>
        <Title
          order={3}
          fz="1.05rem"
          mt={4}
          style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
        >
          {title}
        </Title>
      </div>

      <Paper
        radius="md"
        p="sm"
        withBorder
        style={{
          background: '#fff',
          borderColor: 'var(--rd-border)',
          flex: 1,
        }}
      >
        <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
          {body || '—'}
        </Text>
      </Paper>

      {memories && (
        <Box>
          <Text size="xs" fw={600} c="dimmed" mb={6}>
            Context used
          </Text>
          {memories.length === 0 ? (
            <Text size="xs" c="dimmed">
              No prior customer memories available for this reply.
            </Text>
          ) : (
            <Stack gap={6}>
              {memories.slice(0, 3).map((memory, index) => (
                <Text key={index} size="xs" c="teal.9">
                  • {memory.content}
                </Text>
              ))}
            </Stack>
          )}
        </Box>
      )}
    </Paper>
  );
}

function MemoryImpactPanel({ customer, apiBase }) {
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  async function runComparison() {
    const text = message.trim();
    if (!text || loading) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${apiBase}/api/demo/memory-impact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          customerName: customer.name,
          message: text,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Comparison failed');
      }
      setResult(data);
    } catch (err) {
      setError(err.message || 'Could not run memory impact comparison');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Paper
      radius="lg"
      withBorder
      p="md"
      style={{
        borderColor: 'var(--rd-border)',
        background:
          'linear-gradient(135deg, rgba(240,253,250,0.9) 0%, rgba(255,255,255,0.95) 45%, rgba(248,250,252,0.95) 100%)',
      }}
    >
      <Stack gap="md">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <div>
            <Group gap={8} mb={4}>
              <IconSparkles size={18} color="#0f766e" aria-hidden />
              <Title
                order={2}
                fz="1.05rem"
                style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
              >
                Memory Impact
              </Title>
              <Badge color="teal" variant="light">
                Demo
              </Badge>
            </Group>
            <Text size="sm" c="dimmed" maw={640}>
              Same customer message, two replies: one with no prior context, one
              informed by Hindsight memories. This shows the difference in
              available context — not that one answer is objectively better.
            </Text>
          </div>
        </Group>

        <Group align="flex-end" wrap="wrap" gap="sm">
          <TextInput
            flex={1}
            miw={240}
            label="Customer message"
            value={message}
            onChange={(e) => setMessage(e.currentTarget.value)}
            placeholder="My payment failed again."
          />
          <Button
            color="teal"
            onClick={runComparison}
            loading={loading}
            disabled={!message.trim()}
          >
            Compare responses
          </Button>
        </Group>

        {error && (
          <Alert color="red" variant="light" title="Comparison failed">
            {error}
          </Alert>
        )}

        {loading && (
          <Group gap="sm" c="dimmed">
            <Loader size="sm" color="teal" type="dots" />
            <Text size="sm">
              Generating generic vs memory-informed replies…
            </Text>
          </Group>
        )}

        {result && !loading && (
          <Stack gap="sm">
            <Text size="sm">
              <Text span fw={600}>
                Customer:
              </Text>{' '}
              “{result.message}”
            </Text>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <ResponseCard
                eyebrow="Without memory"
                title="Generic support response"
                body={result.withoutMemory}
                accent={{
                  border: '#e2e8f0',
                  background: '#f8fafc',
                  label: 'dimmed',
                }}
                memories={[]}
              />
              <ResponseCard
                eyebrow="With Hindsight"
                title="Personalized support response"
                body={result.withHindsight}
                accent={{
                  border: '#99f6e4',
                  background: '#f0fdfa',
                  label: 'teal.8',
                }}
                memories={result.memories || []}
              />
            </SimpleGrid>

            <Text size="xs" c="dimmed">
              {result.memoryCount} memor
              {result.memoryCount === 1 ? 'y' : 'ies'} retrieved for the
              Hindsight-informed reply
              {result.recallFailed
                ? ' (recall failed — personalized side may be limited).'
                : '.'}{' '}
              {result.note}
            </Text>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

export default MemoryImpactPanel;
