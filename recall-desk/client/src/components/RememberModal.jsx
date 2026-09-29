import {
  Alert,
  Center,
  Divider,
  Group,
  List,
  Loader,
  Modal,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import CustomerAvatar from './CustomerAvatar.jsx';

function formatTimestamp(value) {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return null;
  }
}

function Section({ title, items }) {
  if (!items?.length) return null;

  return (
    <Stack gap={6}>
      <Text size="sm" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.04em' }}>
        {title}
      </Text>
      <List size="sm" spacing="sm">
        {items.map((item, index) => {
          const content = typeof item === 'string' ? item : item.content;
          const timestamp =
            typeof item === 'object' ? formatTimestamp(item.timestamp) : null;

          return (
            <List.Item key={`${title}-${index}`}>
              <Text size="sm" style={{ lineHeight: 1.45 }}>
                {content}
              </Text>
              {timestamp && (
                <Text size="xs" c="dimmed" mt={2}>
                  {timestamp}
                </Text>
              )}
            </List.Item>
          );
        })}
      </List>
    </Stack>
  );
}

function RememberModal({
  opened,
  onClose,
  customerId,
  customerName,
  loading,
  error,
  profile,
}) {
  const totalCount = profile?.totalCount ?? 0;
  const isEmpty = !loading && !error && totalCount === 0;

  const sections = [
    { title: 'Previous Issues', items: profile?.previousIssues },
    { title: 'Previous Solutions', items: profile?.previousSolutions },
    { title: 'Preferences', items: profile?.preferences },
    { title: 'Unresolved Issues', items: profile?.unresolvedIssues },
    { title: 'Recent Interactions', items: profile?.recentInteractions },
  ].filter((section) => section.items?.length);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Title
          order={3}
          fz="1.1rem"
          style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
        >
          🧠 What I Remember
        </Title>
      }
      centered
      size="lg"
      radius="lg"
      padding="lg"
    >
      <Group gap="sm" mb="md" wrap="nowrap">
        {customerId && (
          <CustomerAvatar
            customerId={customerId}
            name={customerName}
            size={32}
          />
        )}
        <Text size="sm" c="dimmed">
          CUSTOMER MEMORY
          {customerName ? ` — ${customerName}` : ''}
        </Text>
      </Group>

      {loading && (
        <Center py="xl">
          <Stack align="center" gap="sm">
            <Loader color="teal" type="dots" />
            <Text size="sm" c="dimmed">
              Searching Hindsight for customer memories…
            </Text>
          </Stack>
        </Center>
      )}

      {!loading && error && (
        <Alert color="red" variant="light" title="Could not load memories">
          {error}
        </Alert>
      )}

      {!loading && !error && isEmpty && (
        <Alert color="gray" variant="light">
          No previous customer memories found.
        </Alert>
      )}

      {!loading && !error && !isEmpty && (
        <Stack gap="md">
          {sections.map((section, index) => (
            <div key={section.title}>
              {index > 0 && <Divider mb="md" />}
              <Section title={section.title} items={section.items} />
            </div>
          ))}
          <Text size="xs" c="dimmed" mt="xs">
            {totalCount} memor{totalCount === 1 ? 'y' : 'ies'} retrieved from Hindsight
          </Text>
        </Stack>
      )}
    </Modal>
  );
}

export default RememberModal;
