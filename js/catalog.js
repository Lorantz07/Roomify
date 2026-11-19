/* ==========================================================================
   Roomify — Rooms, finishes and starter templates
   ========================================================================== */

(function () {
  'use strict';

  var NS = (window.Roomify = window.Roomify || {});

  var ROOM_TYPES = [
    {
      id: 'living',
      label: 'Living Room',
      widthCm: 500,
      heightCm: 400,
      floor: 'oak',
      defaultName: 'My living room'
    },
    {
      id: 'bedroom',
      label: 'Bedroom',
      widthCm: 400,
      heightCm: 450,
      floor: 'oak',
      defaultName: 'My bedroom'
    },
    {
      id: 'kitchen',
      label: 'Kitchen',
      widthCm: 320,
      heightCm: 360,
      floor: 'stone',
      defaultName: 'My kitchen'
    },
    {
      id: 'workspace',
      label: 'Workspace',
      widthCm: 300,
      heightCm: 320,
      floor: 'ash',
      defaultName: 'My workspace'
    },
    {
      id: 'dining',
      label: 'Dining Room',
      widthCm: 360,
      heightCm: 420,
      floor: 'oak',
      defaultName: 'My dining room'
    },
    {
      id: 'bathroom',
      label: 'Bathroom',
      widthCm: 240,
      heightCm: 300,
      floor: 'stone',
      defaultName: 'My bathroom'
    },
    {
      id: 'blank',
      label: 'Blank Room',
      widthCm: 400,
      heightCm: 500,
      floor: 'oak',
      defaultName: 'My room'
    }
  ];

  var FLOORS = [
    { id: 'oak', label: 'Oak', color: '#d8c2a0', grain: '#c4ab86' },
    { id: 'ash', label: 'Ash', color: '#d5d1c7', grain: '#c1bcb1' },
    { id: 'stone', label: 'Stone', color: '#c8c3b8', grain: '#b5afa4' },
    { id: 'clay', label: 'Clay', color: '#c8a087', grain: '#b58970' }
  ];

  var TEMPLATES = [
    {
      type: 'bedroom',
      floor: 'oak',
      description: 'A calm footprint for rest and storage.'
    },
    {
      type: 'living',
      floor: 'oak',
      description: 'A generous room for slow evenings.'
    },
    {
      type: 'kitchen',
      floor: 'stone',
      description: 'A compact work triangle that flows.'
    },
    {
      type: 'workspace',
      floor: 'ash',
      description: 'A focused corner with room to think.'
    }
  ];

  function getRoomType(id) {
    for (var i = 0; i < ROOM_TYPES.length; i += 1) {
      if (ROOM_TYPES[i].id === id) return ROOM_TYPES[i];
    }
    return null;
  }

  function getFloor(id) {
    for (var i = 0; i < FLOORS.length; i += 1) {
      if (FLOORS[i].id === id) return FLOORS[i];
    }
    return FLOORS[0];
  }

  function areaM2(widthCm, heightCm) {
    var area = (Number(widthCm) * Number(heightCm)) / 10000;
    return Number.isFinite(area) ? area : 0;
  }

  NS.catalog = {
    ROOM_TYPES: ROOM_TYPES,
    FLOORS: FLOORS,
    TEMPLATES: TEMPLATES,
    getRoomType: getRoomType,
    getFloor: getFloor,
    areaM2: areaM2
  };
})();
