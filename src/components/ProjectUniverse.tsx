import { projects } from '../data/projects';

type ProjectUniverseProps = {
  activeProjectId: string;
  reduceMotion: boolean;
};

const nodes = [
  { projectId: 'sentinel', x: 86, y: 132 },
  { projectId: 'cut2short', x: 302, y: 74 },
  { projectId: 'enterprise-knowledge-assistant', x: 520, y: 154 },
  { projectId: 'library-management-system', x: 742, y: 76 },
  { projectId: 'youtube-clone', x: 956, y: 138 },
] as const;

const routes = [
  { path: 'M 86 132 C 150 54, 224 52, 302 74', duration: 8, delay: -1.4 },
  { path: 'M 302 74 C 376 143, 441 179, 520 154', duration: 9, delay: -4.2 },
  { path: 'M 520 154 C 603 109, 660 44, 742 76', duration: 7.5, delay: -2.6 },
  { path: 'M 742 76 C 814 134, 875 168, 956 138', duration: 8.5, delay: -5.5 },
  { path: 'M 86 132 C 302 218, 728 223, 956 138', duration: 13, delay: -7 },
] as const;

export default function ProjectUniverse({ activeProjectId, reduceMotion }: ProjectUniverseProps) {
  return (
    <svg
      className="project-universe-graphic"
      viewBox="0 0 1000 230"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      data-motion={reduceMotion ? 'reduced' : 'continuous'}
    >
      <defs>
        <linearGradient id="universe-path-gradient" x1="0" x2="1">
          <stop offset="0%" stopColor="#718cb5" stopOpacity=".2" />
          <stop offset="50%" stopColor="#94b9e7" stopOpacity=".62" />
          <stop offset="100%" stopColor="#a895df" stopOpacity=".24" />
        </linearGradient>
      </defs>

      {routes.map((route, index) => (
        <path
          className={`project-universe-route project-universe-route-${index + 1}`}
          d={route.path}
          key={route.path}
          fill="none"
        />
      ))}

      {!reduceMotion &&
        routes.map((route) => (
          <circle className="project-universe-packet" key={route.path} r="3.2">
            <animateMotion
              dur={`${route.duration}s`}
              begin={`${route.delay}s`}
              path={route.path}
              repeatCount="indefinite"
            />
          </circle>
        ))}

      {nodes.map((node) => {
        const project = projects.find((item) => item.id === node.projectId);
        if (!project) return null;
        const selected = project.id === activeProjectId;

        return (
          <g
            className={`project-universe-node${selected ? ' is-active' : ''}`}
            data-project-id={project.id}
            key={project.id}
            transform={`translate(${node.x} ${node.y})`}
          >
            <circle className="project-universe-node-halo" r={selected ? 16 : 11} />
            <circle className="project-universe-node-core" r={selected ? 5 : 3.5} />
            <path className="project-universe-node-tick" d="M 0 -19 V -11 M 0 11 V 19" />
          </g>
        );
      })}
    </svg>
  );
}
