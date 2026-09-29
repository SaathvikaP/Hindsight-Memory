import { Group, List, Paper, Stack, Text, Title } from '@mantine/core';
import {
  IconAlertTriangle,
  IconHeartHandshake,
  IconHistory,
  IconTool,
} from '@tabler/icons-react';
import { PanelTitleIcon } from './CustomerAvatar.jsx';
import iconMemory from '../assets/icon-memory.svg';

function MemorySection({ icon, title, items, emptyLabel }) {
  return (
    <Stack gap={6}>
      <Text
        size="xs"
        fw={700}
        tt="uppercase"
        c="dimmed"
        style={{ letterSpacing: '0.04em' }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {icon}
          {title}
        </span>
      </Text>
      {items.length === 0 ? (
        <Text size="sm" c="dimmed">
          {emptyLabel}
        </Text>
      ) : (
        <List size="sm" spacing={6}>
          {items.map((item) => (
            <List.Item key={item}>{item}</List.Item>
          ))}
        </List>
      )}
    </Stack>
  );
}

function MemoryPanel({ memory }) {
  return (
    <Paper
      radius="lg"
      withBorder
      p="md"
      style={{
        borderColor: 'var(--rd-border)',
        background: '#fff',
        height: '100%',
      }}
    >
      <Stack gap="lg">
        <div>
          <Group gap={8} mb={4} wrap="nowrap">
            <PanelTitleIcon
              src={iconMemory}
              alt="Memory nodes icon for customer memory"
              size={22}
            />
            <Title
              order={2}
              fz="1rem"
              fw={600}
              style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
            >
              Customer Memory
            </Title>
          </Group>
          <Text size="sm" c="dimmed">
            Mock memories for this support session
          </Text>
        </div>

        <MemorySection
          icon={<IconHistory size={14} />}
          title="Previous Issues"
          items={memory.previousIssues}
          emptyLabel="No previous issues"
        />
        <MemorySection
          icon={<IconTool size={14} />}
          title="Previous Solutions"
          items={memory.previousSolutions}
          emptyLabel="No previous solutions"
        />
        <MemorySection
          icon={<IconHeartHandshake size={14} />}
          title="Customer Preferences"
          items={memory.preferences}
          emptyLabel="No preferences saved"
        />
        <MemorySection
          icon={<IconAlertTriangle size={14} />}
          title="Unresolved Issues"
          items={memory.unresolvedIssues}
          emptyLabel="No unresolved issues"
        />
      </Stack>
    </Paper>
  );
}

export default MemoryPanel;
