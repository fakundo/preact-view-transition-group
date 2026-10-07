import { useState } from 'preact/hooks';
import { ViewTransitionGroup } from '../../src';
import { Example, randomInt, shuffle, useRespectReducedMotion } from '../ui';

const CODE = `
// a layout component of your design system: it must pass the ref prop to its element
const Stack = ({ ref, gap, className, children }: StackProps) => (
  <div ref={ref} className={\`stack \${className}\`} style={{ gap: \`\${gap}px\` }}>
    {children}
  </div>
);

// the group renders Stack and passes it the other props: gap, className
<ViewTransitionGroup as={Stack} gap={12} className="team">
  {members.map((member) => (
    <span key={member.name}>{member.emoji}</span>
  ))}
</ViewTransitionGroup>
`;

interface StackProps {
  gap?: number;
  className?: string;
  children?: preact.ComponentChildren;
  ref?: preact.Ref<HTMLDivElement>;
}

const Stack = ({ ref, gap = 8, className = '', children }: StackProps) => (
  <div ref={ref} className={`stack ${className}`} style={{ gap: `${gap}px` }}>
    {children}
  </div>
);

const PEOPLE = [
  { name: 'Ada', emoji: '🦊' },
  { name: 'Linus', emoji: '🐧' },
  { name: 'Grace', emoji: '🦉' },
  { name: 'Alan', emoji: '🐢' },
  { name: 'Barbara', emoji: '🐙' },
  { name: 'Ken', emoji: '🦔' },
  { name: 'Margaret', emoji: '🐝' },
  { name: 'Dennis', emoji: '🦁' },
];

export const CustomRoot = () => {
  const respectReducedMotion = useRespectReducedMotion();
  const [members, setMembers] = useState(PEOPLE.slice(0, 4));

  const invite = () => {
    setMembers((prev) => {
      const free = PEOPLE.filter((person) => !prev.includes(person));
      return free.length > 0 ? [...prev, free[0]] : prev;
    });
  };

  const leave = () => {
    setMembers((prev) => {
      const removed = randomInt(0, prev.length - 1);
      return prev.filter((_, index) => index !== removed);
    });
  };

  return (
    <Example
      id="custom-root"
      title="Your own root component"
      tags={['component', 'as', 'enter', 'exit', 'move']}
      description={
        <>
          <code>as</code> takes a component too: here a <code>Stack</code> of a design system. The
          group passes it the other props, like <code>gap</code>, and the ref. In Preact{' '}
          <code>ref</code> is a regular prop: the component passes it to its DOM element.
        </>
      }
      code={CODE}
    >
      <div className="toolbar">
        <button type="button" disabled={members.length === PEOPLE.length} onClick={invite}>
          Invite
        </button>
        <button type="button" disabled={members.length === 0} onClick={leave}>
          Leave
        </button>
        <button type="button" onClick={() => setMembers(shuffle)}>
          Shuffle
        </button>
      </div>
      <ViewTransitionGroup
        respectReducedMotion={respectReducedMotion}
        as={Stack}
        gap={12}
        className="team"
      >
        {members.map((member) => (
          <span key={member.name} title={member.name}>
            <span className="avatar">{member.emoji}</span>
            {member.name}
          </span>
        ))}
      </ViewTransitionGroup>
    </Example>
  );
};
