import { Badge, Box, Group, Image, Stack, Text, Title, rem } from '@mantine/core';
import heroMemory from '../assets/hero-memory.svg';

function TopNav() {
  return (
    <Box
      component="header"
      px={{ base: 'md', md: 'xl' }}
      style={{
        borderBottom: '1px solid var(--rd-border)',
        background: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 0 rgba(15, 23, 42, 0.04)',
      }}
    >
      <Group
        h={{ base: 64, sm: 72 }}
        justify="space-between"
        wrap="nowrap"
        gap="md"
      >
        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
          <Image
            src={heroMemory}
            alt="Abstract AI memory network with support chat bubbles"
            w={{ base: 72, sm: 110, md: 132 }}
            h="auto"
            fit="contain"
            radius="md"
            style={{ flexShrink: 0 }}
          />
          <Stack gap={0} style={{ minWidth: 0 }}>
            <Title
              order={1}
              fz={{ base: '0.98rem', sm: '1.05rem' }}
              fw={700}
              c="dark.8"
              style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
            >
              RecallDesk AI
            </Title>
            <Text size="xs" c="dimmed" visibleFrom="xs" lineClamp={1}>
              Memory-Powered Support
            </Text>
          </Stack>
        </Group>

        <Badge
          size="md"
          variant="light"
          color="teal"
          style={{ flexShrink: 0 }}
          leftSection={
            <Box
              component="span"
              style={{
                width: rem(8),
                height: rem(8),
                borderRadius: '50%',
                background: '#0d9488',
                display: 'inline-block',
              }}
              aria-hidden
            />
          }
        >
          Memory Online
        </Badge>
      </Group>
    </Box>
  );
}

export default TopNav;
