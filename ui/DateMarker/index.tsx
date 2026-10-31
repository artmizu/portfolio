import cls from 'classnames';
import type { ProjectDate } from 'shared/type/Project';
import st from './index.module.scss';

export default function DateMarker({ data }: { data: ProjectDate }) {
  return (
    <div className={cls('ui-p', 'ui-p_small', st.date)}>
      <div className={st.date__from}>{data.from}</div>
      {data.to && (
        <>
          <div className={st.date__dash} />
          <div className={st.date__to}>{data.to}</div>
        </>
      )}
    </div>
  );
}
