import { Box, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { IconArrowDown } from '@tabler/icons-react';
import { PanelTitleIcon } from './CustomerAvatar.jsx';
import iconTimeline from '../assets/icon-timeline.svg';

function LearningTimeline({ items }) {
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
              src={iconTimeline}
              alt="Timeline nodes icon for learning history"
              size={22}
            />
            <Title
              order={2}
              fz="1rem"
              fw={600}
              style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
            >
              Learning Timeline
            </Title>
          </Group>
          <Text size="sm" c="dimmed">
            How memory compounds across interactions
          </Text>
        </div>

        <Stack gap={0} align="stretch">
          {items.map((item, index) => (
            <Box key={item.id}>
              <Box
                p="sm"
                style={{
                  borderRadius: 10,
                  border: '1px solid var(--rd-border)',
                  background: index % 2 === 0 ? '#f8fafc' : '#fff',
                }}
              >
                <Text size="sm" fw={600}>
                  {item.label}
                </Text>
                <Text size="xs" c="dimmed" mt={2}>
                  {item.detail}
                </Text>
              </Box>
              {index < items.length - 1 && (
                <Box
                  py={6}
                  style={{ display: 'grid', placeItems: 'center' }}
                  aria-hidden
                >
                  <IconArrowDown size={16} color="#94a3b8" />
                </Box>
              )}
            </Box>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

export default LearningTimeline;
