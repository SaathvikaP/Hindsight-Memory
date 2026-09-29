import { useEffect, useRef, useState } from 'react';
import {
  ActionIcon,
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Group,
  Image,
  Loader,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  Title,
  Tooltip,
} from '@mantine/core';
import { IconSend2 } from '@tabler/icons-react';
import MemoryTransparency from './MemoryTransparency.jsx';
import MemoryActionPanel from './MemoryActionPanel.jsx';
import CustomerAvatar from './CustomerAvatar.jsx';
import emptyChatVisual from '../assets/empty-chat.svg';

function CustomerChat({
  customer,
  messages,
  loading,
  onSend,
  onOpenRemember,
  memoryTransparency,
  memoryAction,
}) {
  const [input, setInput] = useState('');
  const [draftHint, setDraftHint] = useState(false);
  const viewport = useRef(null);

  useEffect(() => {
    if (viewport.current) {
      viewport.current.scrollTo({
        top: viewport.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, loading, memoryTransparency, memoryAction]);

  // Reset composer when switching customers so drafts never leak across demos.
  useEffect(() => {
    setInput('');
    setDraftHint(false);
  }, [customer?.id]);

  // Focus composer after a Memory → Action draft is inserted.
  useEffect(() => {
    if (!draftHint || !input) return;
    const el = document.querySelector(
      'textarea[aria-label="Message composer"]'
    );
    if (!el) return;
    el.focus();
    const len = el.value.length;
    el.setSelectionRange?.(len, len);
  }, [draftHint, input]);

  function handleSubmit(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setDraftHint(false);
    onSend(text);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function handleUsePreviousSolution(draft) {
    const text = typeof draft === 'string' ? draft.trim() : '';
    if (!text) return;
    setInput(text);
    setDraftHint(true);
  }

  return (
    <Paper
      radius="lg"
      withBorder
      p={0}
      style={{
        borderColor: 'var(--rd-border)',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 520,
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <Box
        px="md"
        py="sm"
        style={{ borderBottom: '1px solid var(--rd-border)' }}
      >
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
          <Group gap="sm" wrap="nowrap">
            <CustomerAvatar
              customerId={customer.id}
              name={customer.name}
              size={42}
            />
            <Stack gap={2}>
              <Title
                order={2}
                fz="1rem"
                fw={600}
                style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
              >
                {customer.name}
              </Title>
              <Group gap={8}>
                <Badge size="sm" variant="light" color="teal">
                  {customer.status}
                </Badge>
                <Text size="xs" c="dimmed">
                  {customer.email}
                </Text>
              </Group>
            </Stack>
          </Group>

          <Button
            variant="light"
            color="teal"
            size="sm"
            onClick={onOpenRemember}
            aria-label="What I Remember"
          >
            🧠 What I Remember
          </Button>
        </Group>
      </Box>

      <ScrollArea style={{ flex: 1 }} px="md" py="md" viewportRef={viewport}>
        <Stack gap="md">
          {messages.length === 0 && !loading && (
            <Stack
              align="center"
              gap="sm"
              py="xl"
              px="md"
              style={{ textAlign: 'center' }}
            >
              <Image
                src={emptyChatVisual}
                alt="Subtle illustration of a support chat with memory nodes"
                maw={180}
                mx="auto"
                radius="lg"
              />
              <Text
                size="sm"
                fw={600}
                c="teal.9"
                style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
              >
                Your AI support agent remembers what matters.
              </Text>
              <Text size="sm" c="dimmed" maw={320}>
                Try a message that matches this customer’s scenario, e.g. “
                {customer.scenario}”.
              </Text>
            </Stack>
          )}

          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <Group
                key={msg.id}
                align="flex-start"
                justify={isUser ? 'flex-end' : 'flex-start'}
                gap="sm"
                wrap="nowrap"
              >
                {!isUser && (
                  <Avatar color="teal" radius="xl" size="sm" mt={2}>
                    AI
                  </Avatar>
                )}
                <Box maw={{ base: '90%', sm: '78%' }}>
                  <Paper
                    p="sm"
                    radius="md"
                    bg={isUser ? 'teal.7' : 'gray.0'}
                    c={isUser ? 'white' : 'dark.7'}
                    style={{
                      border: isUser ? 'none' : '1px solid var(--rd-border)',
                    }}
                  >
                    <Text
                      size="sm"
                      style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}
                    >
                      {msg.content}
                    </Text>
                  </Paper>
                  {msg.time && (
                    <Text
                      size="xs"
                      c="dimmed"
                      mt={4}
                      ta={isUser ? 'right' : 'left'}
                    >
                      {msg.time}
                    </Text>
                  )}
                </Box>
                {isUser && (
                  <Box mt={2} style={{ flexShrink: 0 }}>
                    <CustomerAvatar
                      customerId={customer.id}
                      name={customer.name}
                      size={28}
                    />
                  </Box>
                )}
              </Group>
            );
          })}

          {loading && (
            <Group gap="sm" c="dimmed">
              <Loader size="sm" color="teal" type="dots" />
              <Text size="sm">Generating personalized reply…</Text>
            </Group>
          )}

          {!loading && memoryTransparency && (
            <Box mt="xs" maw="100%">
              <MemoryTransparency
                memories={memoryTransparency.memories}
                memoryCount={memoryTransparency.memoryCount}
                failed={memoryTransparency.failed}
              />
            </Box>
          )}

          {!loading && memoryAction?.available && (
            <Box mt="xs" maw="100%">
              <MemoryActionPanel
                action={memoryAction}
                onUsePreviousSolution={handleUsePreviousSolution}
              />
            </Box>
          )}
        </Stack>
      </ScrollArea>

      <Box
        component="form"
        onSubmit={handleSubmit}
        p="md"
        style={{ borderTop: '1px solid var(--rd-border)' }}
      >
        <Stack gap="sm">
          {draftHint && (
            <Alert color="teal" variant="light" title="Suggested reply draft">
              Inserted from Memory → Action. Review or edit it here. Sending
              posts it as the next customer message in this demo — it is not
              auto-sent and does not execute payments.
            </Alert>
          )}
          <Group align="flex-end" gap="sm" wrap="nowrap">
            <Textarea
              flex={1}
              placeholder={`Type a customer message for ${customer.name}…`}
              value={input}
              onChange={(e) => {
                setInput(e.currentTarget.value);
                if (draftHint) setDraftHint(false);
              }}
              onKeyDown={handleKeyDown}
              disabled={loading}
              autosize
              minRows={1}
              maxRows={6}
              radius="md"
              aria-label="Message composer"
            />
            <Tooltip label="Send message" withArrow>
              <ActionIcon
                type="submit"
                size={42}
                radius="md"
                color="teal"
                variant="filled"
                disabled={loading || !input.trim()}
                aria-label="Send message"
              >
                <IconSend2 size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Stack>
      </Box>
    </Paper>
  );
}

export default CustomerChat;
