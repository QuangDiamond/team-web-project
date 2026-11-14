export function getClassColorMap(sessions) {
  const classNamesById = new Map();
  for (const session of sessions) {
    if (!classNamesById.has(session.class_id)) {
      classNamesById.set(session.class_id, session.class_name || 'Lớp chưa đặt tên');
    }
  }

  const sortedClassIds = [...classNamesById.keys()].sort((firstClassId, secondClassId) => {
    const firstName = classNamesById.get(firstClassId);
    const secondName = classNamesById.get(secondClassId);
    return firstName.localeCompare(secondName, 'vi') || firstClassId.localeCompare(secondClassId);
  });
  const colorByClassId = new Map();

  sortedClassIds.forEach((classId, index) => {
    const hue = Math.round((index * 360) / Math.max(sortedClassIds.length, 1));
    colorByClassId.set(classId, hue);
  });

  return colorByClassId;
}

export function getClassColorStyle(hue) {
  return {
    '--schedule-event-border': `hsl(${hue} 62% 40%)`,
    '--schedule-event-background': `hsl(${hue} 80% 95%)`,
    '--schedule-event-text': `hsl(${hue} 48% 27%)`,
  };
}
