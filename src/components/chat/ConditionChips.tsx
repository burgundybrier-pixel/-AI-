import type { ConditionPatch, SearchConditions } from '../../types/chat';
import { conditionChips } from '../../utils/labels';

/** 챗봇 상단에 고정되는 "현재 적용 중인 조건" (명세서 S05). ×를 누르면 그 조건만 지운다 */
export function ConditionChips({ conditions, onRemove }: { conditions: SearchConditions; onRemove: (patch: ConditionPatch) => void }) {
  const chips = conditionChips(conditions);
  if (!chips.length) return null;
  return (
    <div className="condition-chips" aria-label="현재 조건">
      {chips.map((chip) => (
        <button key={chip.label} onClick={() => onRemove(chip.remove)}>
          {chip.label} <span aria-label="조건 지우기">×</span>
        </button>
      ))}
    </div>
  );
}
