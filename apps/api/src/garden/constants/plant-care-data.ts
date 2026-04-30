import { CareTaskType } from 'generated/prisma/enums';

export interface DefaultCareSchedule {
  taskType: CareTaskType;
  title: string;
  description: string;
  cadenceDays: number;
  preferredHour: number;
}

export interface GrowthThresholds {
  sprouting: number;
  vegetative: number;
  flowering?: number;
  fruiting?: number;
  harvestReady: number;
}

export const PLANT_CARE_SCHEDULES: Record<string, DefaultCareSchedule[]> = {
  'cherry-tomato': [
    {
      taskType: CareTaskType.WATERING,
      title: 'Water cherry tomato',
      description: 'Water at the base. Keep soil moist but not waterlogged.',
      cadenceDays: 2,
      preferredHour: 7,
    },
    {
      taskType: CareTaskType.FERTILIZING,
      title: 'Fertilize cherry tomato',
      description: 'Apply balanced liquid fertilizer to encourage fruiting.',
      cadenceDays: 14,
      preferredHour: 8,
    },
    {
      taskType: CareTaskType.PEST_CHECK,
      title: 'Pest & disease check',
      description:
        'Inspect leaves and stems for whitefly, spider mites, or blight.',
      cadenceDays: 7,
      preferredHour: 9,
    },
  ],

  cucumber: [
    {
      taskType: CareTaskType.WATERING,
      title: 'Water cucumber',
      description:
        'Cucumbers need consistent moisture. Water deeply every 2 days.',
      cadenceDays: 2,
      preferredHour: 7,
    },
    {
      taskType: CareTaskType.FERTILIZING,
      title: 'Fertilize cucumber',
      description:
        'Feed with nitrogen-rich fertilizer during vegetative stage.',
      cadenceDays: 10,
      preferredHour: 8,
    },
  ],

  'water-spinach': [
    {
      taskType: CareTaskType.WATERING,
      title: 'Water morning glory / rau muống',
      description: 'Keep the growing medium consistently wet.',
      cadenceDays: 1,
      preferredHour: 7,
    },
    {
      taskType: CareTaskType.PRUNING,
      title: 'Trim water spinach',
      description: 'Trim tops to encourage bushy growth and prevent bolting.',
      cadenceDays: 7,
      preferredHour: 8,
    },
  ],

  basil: [
    {
      taskType: CareTaskType.WATERING,
      title: 'Water basil',
      description: 'Water when the top centimetre of soil feels dry.',
      cadenceDays: 2,
      preferredHour: 7,
    },
    {
      taskType: CareTaskType.PRUNING,
      title: 'Pinch basil tops',
      description:
        'Remove flower buds and pinch tips to keep leaves flavourful.',
      cadenceDays: 14,
      preferredHour: 9,
    },
  ],

  'thai-basil': [
    {
      taskType: CareTaskType.WATERING,
      title: 'Water Thai basil',
      description:
        'Keep moist. Thai basil prefers slightly wetter conditions than sweet basil.',
      cadenceDays: 2,
      preferredHour: 7,
    },
    {
      taskType: CareTaskType.PRUNING,
      title: 'Pinch Thai basil',
      description: 'Snap off flower spikes to extend the harvest season.',
      cadenceDays: 10,
      preferredHour: 9,
    },
  ],

  mint: [
    {
      taskType: CareTaskType.WATERING,
      title: 'Water mint',
      description: 'Mint loves moisture. Water every 1–2 days in hot weather.',
      cadenceDays: 2,
      preferredHour: 7,
    },
    {
      taskType: CareTaskType.PRUNING,
      title: 'Trim mint runners',
      description:
        'Cut back runners to prevent mint from spreading aggressively.',
      cadenceDays: 14,
      preferredHour: 9,
    },
  ],
};

export const DEFAULT_CARE_SCHEDULE: DefaultCareSchedule[] = [
  {
    taskType: CareTaskType.WATERING,
    title: 'Water plant',
    description: 'Water regularly. Check the soil before watering.',
    cadenceDays: 3,
    preferredHour: 7,
  },
  {
    taskType: CareTaskType.PEST_CHECK,
    title: 'Pest & health check',
    description:
      'Inspect the plant for any unusual spots, pests, or signs of stress.',
    cadenceDays: 7,
    preferredHour: 9,
  },
];

export function getCareScheduleForSpecies(slug: string): DefaultCareSchedule[] {
  return PLANT_CARE_SCHEDULES[slug] ?? DEFAULT_CARE_SCHEDULE;
}
