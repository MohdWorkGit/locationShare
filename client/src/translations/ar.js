export default {
  app: {
    title: 'تتبع الموقع المباشر',
    subtitle: 'التنسيق والتتبع الجماعي في الوقت الفعلي'
  },
  setup: {
    createRoom: 'إنشاء غرفة جديدة (قائد)',
    joinRoom: 'الانضمام إلى غرفة موجودة',
    selectPublicRoom: 'اختر غرفة عامة',
    name: 'اسمك',
    roomCode: 'رمز الغرفة',
    chooseColor: 'اختر لونك',
    uploadPhoto: 'تحميل صورتك',
    chooseIcon: 'أو اختر أيقونة',
    createAndStart: 'إنشاء الغرفة وبدء التتبع',
    joinAndStart: 'الانضمام إلى الغرفة وبدء التتبع',
    backToSetup: 'العودة إلى الإعداد',
    loadingRooms: 'جارٍ تحميل الغرف...',
    noPublicRooms: 'لا توجد غرف عامة متاحة',
    online: 'متصل'
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
  },
  admin: {
    title: 'لوحة تحكم المسؤول',
    createRoom: 'إنشاء غرفة جديدة',
    rooms: 'الغرف',
    code: 'الرمز',
    users: 'المستخدمون',
    online: 'متصل',
    leaders: 'القادة',
    makePublic: 'جعلها عامة',
    makePrivate: 'جعلها خاصة',
    deleteRoom: 'حذف الغرفة',
    confirmDelete: 'هل أنت متأكد من حذف هذه الغرفة؟',
    roomCreated: 'تم إنشاء الغرفة بنجاح',
    roomDeleted: 'تم حذف الغرفة بنجاح',
    roomUpdated: 'تم تحديث الغرفة بنجاح',
    leaderAssigned: 'تم تعيين القائد بنجاح',
    leaderRemoved: 'تمت إزالة القائد بنجاح',
    roomName: 'اسم الغرفة',
    isPublic: 'غرفة عامة',
    cancel: 'إلغاء',
    create: 'إنشاء',
    roomDetails: 'تفاصيل الغرفة',
    noRoomSelected: 'اختر غرفة لعرض التفاصيل',
    map: 'الخريطة',
    makeLeader: 'جعل قائدًا',
    removeLeader: 'إزالة القائد',
    noUsers: 'لا يوجد مستخدمون في هذه الغرفة'
  }
}
