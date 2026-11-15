import { RESUME_FILENAME, RESUME_PATH } from '../../lib/profile';

export default function ResumeDownload() {
  if (typeof __HAS_RESUME__ === 'undefined' || !__HAS_RESUME__) return null;

  return (
    <a href={RESUME_PATH} download={RESUME_FILENAME} aria-label="Download résumé (PDF)">
      Résumé
    </a>
  );
}
