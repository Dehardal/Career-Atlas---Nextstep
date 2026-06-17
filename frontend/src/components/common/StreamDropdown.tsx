import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { CustomDropdown } from './CustomDropdown';
import type { DropdownOption } from './CustomDropdown';
import type { Node } from '../../services/api';

interface StreamDropdownProps {
  /** Currently selected stream node (or null) */
  selectedStream: Node | null;
  /** Callback when a stream is selected. Passes the full node or null (when cleared). */
  onSelect: (node: Node | null) => void;
}

/**
 * A small wrapper around {@link CustomDropdown} that loads all stream nodes
 * from the backend and presents them as selectable options.
 *
 * The component is deliberately lightweight: it fetches the list once on mount
 * and caches it locally. Selecting a stream updates the global store via the
 * `onSelect` prop which is wired to `setStreamNode` in `useRoadmapStore`.
 */
export const StreamDropdown: React.FC<StreamDropdownProps> = ({ selectedStream, onSelect }) => {
  const [streams, setStreams] = useState<Node[]>([]);
  const [loading, setLoading] = useState(false);

  // Load stream nodes only once when the component mounts.
  useEffect(() => {
    const loadStreams = async () => {
      setLoading(true);
      try {
        const res = await api.getNodes({ limit: 1000 });
        setStreams(res.nodes.filter(n => n.type === 'STREAM'));
      } catch (err) {
        console.error('Failed to load streams', err);
        setStreams([]);
      } finally {
        setLoading(false);
      }
    };
    loadStreams();
  }, []);

  // Convert stream nodes to dropdown option shape.
  const options: DropdownOption[] = streams.map((s) => ({
    value: s._id,
    label: s.name,
    // No custom icon needed for streams – keep UI simple.
  }));

  const handleChange = (value: string) => {
    const node = streams.find((s) => s._id === value) || null;
    onSelect(node);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <CustomDropdown
      options={options}
      value={selectedStream?._id || ''}
      onChange={handleChange}
      placeholder="Select stream..."
      showSearch={true}
    />
  );
};

export default StreamDropdown;
