import React from 'react';
import {
  CalendarDays,
  Users,
  FileCheck2,
  Mail,
  BarChart3,
  Brain,
  Globe2,
  BadgeCheck,
  FolderGit2,
} from 'lucide-react';

const columns = [
  [CalendarDays, Users, Globe2],
  [FileCheck2, Brain, BarChart3],
  [Mail, BadgeCheck, FolderGit2],
] as const;

const HeroFeatureColumns: React.FC = () => {
  return (
    <div className="hidden flex-1 justify-end lg:flex">
      <div className="relative h-[420px] w-full max-w-md">
        {/* Soft glow behind the icons */}
        <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-sky-500/10 blur-3xl" />

        <div className="absolute inset-y-0 right-0 flex gap-6">
          {columns.map((ColumnIcons, colIndex) => (
            <div
              key={colIndex}
              className="relative flex w-20 flex-col items-center justify-between"
            >
              {ColumnIcons.map((Icon, i) => {
                const directionClass =
                  colIndex === 1 ? 'feature-orbit-down' : 'feature-orbit-up';

                return (
                  <div
                    key={i}
                    className={`feature-orbit ${directionClass}`}
                    style={{
                      animationDelay: `${i * 1.1 + colIndex * 0.7}s`,
                    }}
                  >
                    <div className="relative flex h-[60px] w-[60px] items-center justify-center">
                      <span className="pointer-events-none absolute h-12 w-12 rounded-full bg-white/25 blur-md" />
                      <Icon size={33} strokeWidth={1.6} className="text-white/90" />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <style>{`
          .feature-orbit {
            position: relative;
            margin: 1.5rem 0;
            padding: 0;
            border-radius: 9999px;
            background: transparent;
            border: none;
            box-shadow: none;
            animation-duration: 11s;
            animation-iteration-count: infinite;
            animation-timing-function: ease-in-out;
          }

          .feature-orbit-up {
            animation-name: heroFeatureFloatUp;
          }

          .feature-orbit-down {
            animation-name: heroFeatureFloatDown;
          }

          @keyframes heroFeatureFloatUp {
            0% {
              transform: translateY(42px);
              opacity: 0;
            }
            18% {
              opacity: 1;
            }
            82% {
              opacity: 1;
            }
            100% {
              transform: translateY(-42px);
              opacity: 0;
            }
          }

          @keyframes heroFeatureFloatDown {
            0% {
              transform: translateY(-42px);
              opacity: 0;
            }
            18% {
              opacity: 1;
            }
            82% {
              opacity: 1;
            }
            100% {
              transform: translateY(42px);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default HeroFeatureColumns;

