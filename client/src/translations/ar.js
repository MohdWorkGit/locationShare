export default {
  app: {
    title: 'تتبع الموقع المباشر',
    subtitle: 'التنسيق والتتبع الجماعي في الوقت الفعلي'
  },
  setup: {
    createRoom: 'إنشاء غرفة جديدة (قائد)',
    joinRoom: 'الانضمام إلى غرفة موجودة',
    name: 'اسمك',
    roomCode: 'رمز الغرفة',
    chooseColor: 'اختر لونك',
    uploadPhoto: 'تحميل صورتك',
    chooseIcon: 'أو اختر أيقونة',
    createAndStart: 'إنشاء الغرفة وبدء التتبع',
    joinAndStart: 'الانضمام إلى الغرفة وبدء التتبع',
    backToSetup: 'العودة إلى الإعداد'
  },
  room: {
    roomLabel: 'الغرفة',
    role: 'الدور',
    leader: 'قائد',
    member: 'عضو',
    members: 'الأعضاء',
    leaveRoom: 'مغادرة الغرفة',
    online: 'متصل',
    offline: 'غير متصل',
    lastSeen: 'آخر ظهور'
  },
  memberList: {
    groupMembers: 'أعضاء المجموعة',
    locationShared: 'الموقع مشترك',
    noLocation: 'لا يوجد موقع'
  },
  leader: {
    controls: 'أدوات القائد',
    addDestinations: 'إضافة وجهات',
    addDestinationsHint: 'انقر في أي مكان على الخريطة لإضافة وجهة إلى المسار',
    showPaths: 'إظهار',
    hidePaths: 'إخفاء',
    memberPaths: 'مسارات الأعضاء',
    clearRoute: 'مسح المسار',
    confirmClearPath: 'هل أنت متأكد من أنك تريد مسح مسار الوجهة بالكامل؟',
    destinationRoute: 'مسار الوجهات',
    noDestinations: 'لم يتم إضافة وجهات بعد. انقر على الخريطة لإضافة وجهات.',
    exportRoute: 'تصدير المسار',
    togglePaths: 'تبديل سجل المسار',
    pathsShown: 'المسارات ظاهرة',
    pathsHidden: 'المسارات مخفية',
    current: 'الحالي',
    completed: 'مكتمل',
    destination: 'الوجهة'
  },
  destinationPath: {
    removeDestination: 'إزالة الوجهة',
    confirmRemove: 'هل أنت متأكد من أنك تريد إزالة هذه الوجهة؟'
  },
  map: {
    street: 'خريطة الشارع',
    satellite: 'خريطة القمر الصناعي',
    zoomIn: 'تكبير',
    zoomOut: 'تصغير',
    trackLocation: 'تتبع موقعي',
    stopTrackingLocation: 'إيقاف تتبع الموقع',
    trackDestination: 'تتبع الوجهة الحالية',
    stopTrackingDestination: 'إيقاف تتبع الوجهة',
    switchTo: 'التبديل إلى',
    view: 'عرض',
    currentDestination: 'الوجهة الحالية',
    added: 'تمت الإضافة',
    accuracy: 'الدقة'
  },
  export: {
    json: 'JSON',
    gpx: 'GPX',
    csv: 'CSV'
  },
  notifications: {
    pathHistory: 'سجل المسار',
    shown: 'ظاهر',
    hidden: 'مخفي',
    exporting: 'جاري تصدير المسار كـ',
    failed: 'فشل تصدير المسار',
    leftRoom: 'تم مغادرة الغرفة بنجاح'
  }
}
