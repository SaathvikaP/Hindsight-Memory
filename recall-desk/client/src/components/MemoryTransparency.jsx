import { Badge, Box, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';

const CATEGORY_COLORS = {
  'Previous Issue': 'orange',
  'Previous Solution': 'teal',
  Preference: 'blue',
  'Unresolved Issue': 'red',
};

function MemoryTransparency({ memories = [], memoryCount = 0, failed = false }) {
  if (failed) {
    return (
      <Paper
        radius="md"
        p="md"
        withBorder
        style={{
          borderColor: '#fecaca',
          background: '#fef2f2',
        }}
        aria-label="Memory transparency"
      >
        <Text size="sm" fw={600} mb={4}>
          🧠 MEMORY USED
        </Text>
        <Text size="sm" c="dimmed">
          Memory retrieval failed for this turn. The reply may be less personalized.
        </Text>
      </Paper>
    );
  }

  if (!memories.length) {
    return (
      <Paper
        radius="md"
        p="md"
        withBorder
        style={{
          borderColor: 'var(--rd-border)',
          background: '#f8fafc',
          borderStyle: 'dashed',
        }}
        aria-label="Memory transparency"
      >
        <Text size="sm" fw={600} mb={4}>
          🧠 MEMORY USED
        </Text>
        <Text size="sm" c="dimmed">
          No relevant memories were retrieved for this message.
        </Text>
      </Paper>
    );
  }

  return (
    <Paper
      radius="md"
      p="md"
      withBorder
      style={{
        borderColor: '#99f6e4',
        background: '#f0fdfa',
      }}
      aria-label="Memory transparency"
    >
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Title
            order={3}
            fz="0.85rem"
            fw={700}
            style={{ letterSpacing: '0.04em', fontFamily: 'Outfit, system-ui, sans-serif' }}
          >
            🧠 MEMORY USED
          </Title>
          <Badge color="teal" variant="light" size="sm">
            Dashboard only
          </Badge>
        </Group>

        <Stack gap="sm">
          {memories.map((memory, index) => (
            <Box
              key={`${memory.category}-${index}`}
              p="sm"
              style={{
                borderRadius: 8,
                background: '#fff',
                border: '1px solid var(--rd-border)',
              }}
            >
              <Group gap={8} mb={4}>
                <Badge
                  size="sm"
                  variant="light"
                  color={CATEGORY_COLORS[memory.category] || 'gray'}
                >
                  {memory.category}
                </Badge>
                <Badge size="sm" variant="outline" color="gray">
                  relevance: {memory.relevance}
                </Badge>
              </Group>
              <Text size="sm" style={{ lineHeight: 1.45 }}>
                {memory.content}
              </Text>
            </Box>
          ))}
        </Stack>

        <Group gap={6} c="teal.8">
          <IconCheck size={16} aria-hidden />
          <Text size="sm" fw={600}>
            ✓ {memoryCount} relevant {memoryCount === 1 ? 'memory' : 'memories'} used
          </Text>
        </Group>
      </Stack>
    </Paper>
  );
}

export default MemoryTransparency;
