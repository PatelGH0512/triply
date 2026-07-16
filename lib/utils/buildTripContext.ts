import dayjs from 'dayjs';
import { TripWithDetails } from '@/types';
import { Day, Activity } from '@/types';

export function buildTripContext(
  trip: TripWithDetails,
  days: Day[],
  activities: Activity[],
): string {
  const destinations = trip.trip_destinations.map((d) => d.name).join(', ') || 'Unknown';
  const memberCount = trip.trip_members.length;
  const startDate = dayjs(trip.start_date).format('MMM D, YYYY');
  const endDate = dayjs(trip.end_date).format('MMM D, YYYY');
  const totalDays = dayjs(trip.end_date).diff(dayjs(trip.start_date), 'day') + 1;

  const activitiesByDay: Record<string, Activity[]> = {};
  for (const activity of activities) {
    if (!activitiesByDay[activity.day_id]) {
      activitiesByDay[activity.day_id] = [];
    }
    activitiesByDay[activity.day_id].push(activity);
  }

  const itinerary = days
    .map((day, index) => {
      const dayActivities = activitiesByDay[day.id] ?? [];
      const dayDate = dayjs(day.date).format('MMM D');
      const label = day.label ? ` — ${day.label}` : '';
      const activityLines =
        dayActivities.length === 0
          ? '    No activities planned yet'
          : dayActivities
              .map((a) => {
                const time = a.start_time ? `${a.start_time} ` : '';
                const location = a.location_name ? ` at ${a.location_name}` : '';
                return `    - ${time}${a.title}${location}`;
              })
              .join('\n');
      return `  Day ${index + 1} (${dayDate})${label}:\n${activityLines}`;
    })
    .join('\n\n');

  return `You are a travel assistant for a group trip planning app called Triply.
You are helping plan a trip with the following details:

Trip: ${trip.name}
Destination(s): ${destinations}
Dates: ${startDate} to ${endDate} (${totalDays} days)
Group size: ${memberCount} people

Current itinerary:
${itinerary || '  No days planned yet'}

Your role:
- Suggest activities, restaurants, hotels, and experiences
- Answer questions about the destination (visa, weather, currency, culture, safety)
- Help fill gaps in the itinerary
- Give budget estimates when asked
- Be concise, friendly, and specific to the destination
- Do NOT make up specific prices — give ranges instead
- Always tailor suggestions to the group size of ${memberCount} people
- You cannot directly modify the trip — suggest things and let the user add them

Keep responses conversational and concise. Use bullet points for lists.`;
}
