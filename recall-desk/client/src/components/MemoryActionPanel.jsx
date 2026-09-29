import { Badge, Box, Button, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { IconArrowRight, IconSparkles } from '@tabler/icons-react';

function Row({ label, value }) {
  if (!value) return null;

  return (
    <Box>
      <Text
        size="xs"
        fw={700}
        tt="uppercase"
        c="dimmed"
        style={{ letterSpacing: '0.05em' }}
      >
        {label}
      </Text>
      <Text size="sm" mt={2} style={{ lineHeight: 1.45 }}>
        {value}
      </Text>
    </Box>
  );
}

/**
 * Shown only when retrieved memories include a previous solution.
 */
function MemoryActionPanel({ action, onUsePreviousSolution }) {
  if (!action?.available) return null;

  return (
    <Paper
      radius="md"
      p="md"
      withBorder
      style={{
        borderColor: '#5eead4',
        background:
          'linear-gradient(135deg, #f0fdfa 0%, #ffffff 55%, #f8fafc 100%)',
      }}
      aria-label="Memory to action"
    >
      <Stack gap="sm">
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap={8}>
            <IconSparkles size={16} color="#0f766e" aria-hidden />
            <Title
              order={3}
              fz="0.85rem"
              fw={700}
              style={{
                letterSpacing: '0.05em',
                fontFamily: 'Outfit, system-ui, sans-serif',
              }}
            >
              MEMORY → ACTION
            </Title>
          </Group>
          <Badge color="teal" variant="light" size="sm">
            From retrieved memories
          </Badge>
        </Group>

        <Stack
          gap="sm"
          p="sm"
          style={{
            borderRadius: 8,
            background: '#fff',
            border: '1px solid var(--rd-border)',
          }}
        >
          <Row label="Detected problem" value={action.detectedProblem} />
          <Row
            label="Previous successful solution"
            value={action.previousSolution}
          />
          <Row
            label="Customer preference"
            value={action.preference || 'None found in retrieved memories'}
          />
          <Group gap={6} align="flex-start" wrap="nowrap">
            <IconArrowRight
              size={16}
              color="#0f766e"
              style={{ marginTop: 3, flexShrink: 0 }}
              aria-hidden
            />
            <Row label="Suggested next step" value={action.suggestedNextStep} />
          </Group>
        </Stack>

        <Text size="xs" c="dimmed">
          {action.disclaimer}
        </Text>

        <Button
          color="teal"
          variant="filled"
          onClick={() => onUsePreviousSolution?.(action.composerDraft)}
          disabled={!action.composerDraft}
        >
          Use Previous Solution
        </Button>
      </Stack>
    </Paper>
  );
}

export default MemoryActionPanel;
