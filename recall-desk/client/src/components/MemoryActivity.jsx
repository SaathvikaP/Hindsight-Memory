import { Box, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { IconCheck, IconCircleDot, IconX } from '@tabler/icons-react';
import { PanelTitleIcon } from './CustomerAvatar.jsx';
import iconActivity from '../assets/icon-activity.svg';

function stepTone(step, isDone, isActive) {
  if (step.failed) {
    return {
      border: '#fecaca',
      background: '#fef2f2',
      color: 'red.8',
    };
  }
  if (isDone || isActive) {
    return {
      border: '#99f6e4',
      background: isDone ? '#f0fdfa' : '#ccfbf1',
      color: 'teal.9',
    };
  }
  return {
    border: 'var(--rd-border)',
    background: '#f8fafc',
    color: 'dimmed',
  };
}

function MemoryActivity({ steps, activeIndex, completed }) {
  return (
    <Paper
      radius="lg"
      withBorder
      p="md"
      style={{ borderColor: 'var(--rd-border)', background: '#fff' }}
    >
      <Stack gap="md">
        <div>
          <Group gap={8} mb={4} wrap="nowrap">
            <PanelTitleIcon
              src={iconActivity}
              alt="Pipeline nodes icon for memory activity"
              size={22}
            />
            <Title
              order={2}
              fz="1rem"
              fw={600}
              style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
            >
              Memory Activity
            </Title>
          </Group>
          <Text size="sm" c="dimmed">
            Live pipeline for the latest message (recall ≠ retain)
          </Text>
        </div>

        <Group gap="xs" wrap="wrap">
          {steps.map((step, index) => {
            const isDone = completed || index < activeIndex;
            const isActive = !completed && index === activeIndex;
            const tone = stepTone(step, isDone, isActive);

            return (
              <Box
                key={step.id}
                px="sm"
                py={8}
                style={{
                  borderRadius: 10,
                  border: `1px solid ${tone.border}`,
                  background: tone.background,
                  minWidth: 140,
                  flex: '1 1 140px',
                }}
              >
                <Group gap={8} wrap="nowrap">
                  {step.failed ? (
                    <IconX size={16} color="#b91c1c" aria-hidden />
                  ) : isDone ? (
                    <IconCheck size={16} color="#0f766e" aria-hidden />
                  ) : (
                    <IconCircleDot
                      size={16}
                      color={isActive ? '#0f766e' : '#94a3b8'}
                      aria-hidden
                    />
                  )}
                  <Text
                    size="sm"
                    fw={isActive || step.failed ? 600 : 500}
                    c={tone.color}
                  >
                    {step.label}
                  </Text>
                </Group>
              </Box>
            );
          })}
        </Group>
      </Stack>
    </Paper>
  );
}

export default MemoryActivity;
