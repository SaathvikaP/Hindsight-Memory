import { Avatar, Image } from '@mantine/core';
import sarahAvatar from '../assets/avatars/sarah-wilson.svg';
import davidAvatar from '../assets/avatars/david-miller.svg';
import priyaAvatar from '../assets/avatars/priya-sharma.svg';

const AVATARS = {
  'sarah-wilson': {
    src: sarahAvatar,
    alt: 'Illustrated avatar of Sarah Wilson',
  },
  'david-miller': {
    src: davidAvatar,
    alt: 'Illustrated avatar of David Miller',
  },
  'priya-sharma': {
    src: priyaAvatar,
    alt: 'Illustrated avatar of Priya Sharma',
  },
};

export function getCustomerAvatar(customerId) {
  return AVATARS[customerId] || null;
}

/**
 * Consistent illustrated avatar for demo customers.
 */
function CustomerAvatar({ customerId, name, size = 42 }) {
  const avatar = getCustomerAvatar(customerId);
  const initials = String(name || '?')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (!avatar) {
    return (
      <Avatar color="teal" radius="xl" size={size}>
        {initials}
      </Avatar>
    );
  }

  return (
    <Avatar
      src={avatar.src}
      alt={avatar.alt}
      radius="xl"
      size={size}
      imageProps={{
        style: { objectFit: 'cover' },
      }}
    />
  );
}

export function PanelTitleIcon({ src, alt, size = 22 }) {
  return (
    <Image
      src={src}
      alt={alt}
      w={size}
      h={size}
      fit="contain"
      radius="md"
      style={{ flexShrink: 0 }}
    />
  );
}

export default CustomerAvatar;
