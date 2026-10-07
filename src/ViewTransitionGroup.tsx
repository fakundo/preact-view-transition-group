import { isValidElement, toChildArray } from 'preact';
import { useCallback, useLayoutEffect, useReducer, useRef } from 'preact/hooks';
import { useViewTransitionGroup } from './useViewTransitionGroup';
import type { UseViewTransitionGroupOptions } from './useViewTransitionGroup';
import { isDev, warnOnce } from './helpers';
import { COMPONENT_NAME, DEFAULT_ROOT_TAG, WARNING_CHILDREN_MISMATCH } from './constants';

export interface ViewTransitionGroupProps extends UseViewTransitionGroupOptions {
  children?: preact.ComponentChildren;
}

type ElementType = keyof preact.JSX.IntrinsicElements | preact.ComponentType<any>;

/** Group props, `as` and the props of the root element */
export type PolymorphicViewTransitionGroupProps<E extends ElementType = typeof DEFAULT_ROOT_TAG> =
  ViewTransitionGroupProps & {
    /** A component must pass `ref` to a DOM element */
    as?: E;
  } & Omit<preact.ComponentProps<E>, keyof ViewTransitionGroupProps | 'as'>;

type PolymorphicViewTransitionGroupComponent = (<E extends ElementType = typeof DEFAULT_ROOT_TAG>(
  props: PolymorphicViewTransitionGroupProps<E>,
) => preact.JSX.Element) & { displayName?: string };

type ViewTransitionGroupImplProps = ViewTransitionGroupProps & {
  as?: ElementType;
  ref?: preact.Ref<HTMLElement>;
  [prop: string]: unknown;
};

const getKeys = (children: preact.ComponentChildren) =>
  toChildArray(children).map((child) => (isValidElement(child) ? child.key : null));

/** `add`, `remove` and `move` by the keys; empty when the keys are the same */
const getTransitionTypes = (prev: preact.ComponentChildren, next: preact.ComponentChildren) => {
  if (prev === next) {
    return [];
  }
  const prevKeys = getKeys(prev);
  const nextKeys = getKeys(next);
  const prevSet = new Set(prevKeys);
  const nextSet = new Set(nextKeys);
  const keptPrev = prevKeys.filter((key) => nextSet.has(key));
  const keptNext = nextKeys.filter((key) => prevSet.has(key));
  const types: string[] = [];
  if (nextKeys.some((key) => !prevSet.has(key))) {
    types.push('add');
  }
  if (prevKeys.some((key) => !nextSet.has(key))) {
    types.push('remove');
  }
  if (keptPrev.some((key, index) => key !== keptNext[index])) {
    types.push('move');
  }
  return types;
};

/**
 * Animates its children when they are added, removed or moved, with the types
 * `add`, `remove` and `move`. Other changes are applied at once
 */
export const ViewTransitionGroup = ((props: ViewTransitionGroupImplProps) => {
  const {
    as: Component = DEFAULT_ROOT_TAG,
    ref,
    children,
    childVtClass,
    rootVtClass,
    disabled,
    respectReducedMotion,
    onTransitionStart,
    onTransitionEnd,
    ...rest
  } = props;
  const [rootRef, startTransition] = useViewTransitionGroup({
    childVtClass,
    rootVtClass,
    disabled,
    respectReducedMotion,
    onTransitionStart,
    onTransitionEnd,
  });
  // A ref is safe to change in render: Preact has no concurrent rendering
  const renderedRef = useRef(children);
  const [, rerender] = useReducer((count: number) => count + 1, 0);
  // Children for the update of the started transition
  const nextRef = useRef<{ children: preact.ComponentChildren } | null>(null);
  const types = getTransitionTypes(renderedRef.current, children);
  const keysChanged = types.length > 0;

  if (!keysChanged) {
    renderedRef.current = children;
  }

  useLayoutEffect(() => {
    const next = nextRef.current;
    // Re-rendered before the update: it shows the latest children
    if (next && (!keysChanged || getTransitionTypes(next.children, children).length === 0)) {
      next.children = children;
    } else if (keysChanged) {
      const target = { children };
      nextRef.current = target;
      startTransition(
        () => {
          if (nextRef.current === target) {
            nextRef.current = null;
          }
          renderedRef.current = target.children;
          rerender(undefined);
        },
        { types },
      );
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps, react/exhaustive-effect-dependencies
  }, [children]);

  const rendered = renderedRef.current;

  // Every child must render one element
  useLayoutEffect(() => {
    const rootNode = rootRef.current;
    if (isDev() && rootNode && toChildArray(rendered).length !== rootNode.children.length) {
      warnOnce(WARNING_CHILDREN_MISMATCH);
    }
  }, [rendered, rootRef]);

  const mergedRef = useCallback<preact.RefCallback<HTMLElement>>(
    (node) => {
      rootRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref, rootRef],
  );

  return (
    <Component {...rest} ref={mergedRef}>
      {rendered}
    </Component>
  );
}) as PolymorphicViewTransitionGroupComponent;

ViewTransitionGroup.displayName = COMPONENT_NAME;
