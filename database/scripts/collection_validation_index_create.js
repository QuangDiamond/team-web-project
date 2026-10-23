// TuConnector – khởi tạo database trên MongoDB Atlas
// Sinh tự động từ tuconnector_erd_3_mongo_embedded.dbml
// Chạy: mongosh "<connection string>" --file init_tuconnector.js
// Chạy lại nhiều lần vẫn an toàn: collection đã có thì chỉ cập nhật validator, index đã có thì bỏ qua.

// Tên DB lấy theo URI (vd .../WDP_DB). URI không ghi tên DB thì mongosh dùng 'test' -> đổi sang 'tuconnector'.
const URI_DB = typeof db.getName === 'function' ? db.getName() : 'test';
const DB_NAME = URI_DB !== 'test' ? URI_DB : 'tuconnector';
const VALIDATION_ACTION = 'error'; // 'warn' = chỉ ghi log khi dữ liệu sai schema (dễ dev), 'error' = chặn luôn
const d = db.getSiblingDB(DB_NAME);

function ensureCollection(name, schema) {
  const exists = d.getCollectionNames().includes(name);
  const opts = { validator: { $jsonSchema: schema }, validationLevel: 'moderate', validationAction: VALIDATION_ACTION };
  if (exists) d.runCommand(Object.assign({ collMod: name }, opts));
  else d.createCollection(name, opts);
  print((exists ? 'updated  ' : 'created  ') + name);
}
function ensureIndex(name, keys, options) {
  d.getCollection(name).createIndex(keys, options || {});
}

// ---------- User ----------
ensureCollection("User", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "full_name": {
      "bsonType": "string"
    },
    "email": {
      "bsonType": "string"
    },
    "phone": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "password_hash": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "email_verify_status": {
      "bsonType": [
        "bool",
        "null"
      ]
    },
    "role": {
      "bsonType": "string",
      "enum": [
        "PARENT",
        "STUDENT",
        "TUTOR",
        "ADMIN"
      ]
    },
    "is_onboarded": {
      "bsonType": [
        "bool",
        "null"
      ]
    },
    "created_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "account_status": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "ACTIVE",
        "BANNED",
        "SUSPENDED",
        null
      ]
    },
    "failed_login_attempts": {
      "bsonType": [
        "int",
        "null"
      ]
    },
    "last_login_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "updated_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "has_password": {
      "bsonType": [
        "bool",
        "null"
      ]
    },
    "avatar_url": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "is_login_locked": {
      "bsonType": [
        "bool",
        "null"
      ]
    },
    "google_account": {
      "bsonType": [
        "object",
        "null"
      ],
      "properties": {
        "google_id": {
          "bsonType": "string"
        },
        "google_email": {
          "bsonType": "string"
        }
      },
      "required": [
        "google_id",
        "google_email"
      ]
    },
    "credit_wallet": {
      "bsonType": [
        "object",
        "null"
      ],
      "properties": {
        "balance": {
          "bsonType": [
            "int",
            "null"
          ]
        },
        "updated_at": {
          "bsonType": [
            "date",
            "null"
          ]
        }
      }
    },
    "notification_preferences": {
      "bsonType": [
        "object",
        "null"
      ],
      "properties": {
        "enable_in_app": {
          "bsonType": [
            "bool",
            "null"
          ]
        },
        "enable_email": {
          "bsonType": [
            "bool",
            "null"
          ]
        },
        "enable_sms": {
          "bsonType": [
            "bool",
            "null"
          ]
        },
        "notify_on_sessions": {
          "bsonType": [
            "bool",
            "null"
          ]
        },
        "notify_on_assignments": {
          "bsonType": [
            "bool",
            "null"
          ]
        },
        "notify_on_messages": {
          "bsonType": [
            "bool",
            "null"
          ]
        },
        "updated_at": {
          "bsonType": [
            "date",
            "null"
          ]
        }
      }
    },
    "subscription": {
      "bsonType": [
        "object",
        "null"
      ],
      "properties": {
        "plan_id": {
          "bsonType": [
            "objectId",
            "null"
          ]
        },
        "status": {
          "bsonType": [
            "string",
            "null"
          ],
          "enum": [
            "ACTIVE",
            "EXPIRED",
            null
          ]
        },
        "expires_at": {
          "bsonType": [
            "date",
            "null"
          ]
        },
        "ai_quota_used": {
          "bsonType": [
            "int",
            "null"
          ]
        },
        "ai_quota_reset_at": {
          "bsonType": [
            "date",
            "null"
          ]
        },
        "start_date": {
          "bsonType": [
            "date",
            "null"
          ]
        },
        "created_at": {
          "bsonType": [
            "date",
            "null"
          ]
        }
      }
    },
    "student_profile": {
      "bsonType": [
        "object",
        "null"
      ],
      "properties": {
        "full_name": {
          "bsonType": [
            "string",
            "null"
          ]
        },
        "grade_level": {
          "bsonType": [
            "string",
            "null"
          ]
        }
      }
    }
  },
  "required": [
    "_id",
    "full_name",
    "email",
    "role"
  ]
});
ensureIndex("User", {"email":1}, {"unique":true});

// ---------- EMAIL_VERIFICATION_TOKENS ----------
ensureCollection("EMAIL_VERIFICATION_TOKENS", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "user_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "token_value": {
      "bsonType": "string"
    },
    "expired_at": {
      "bsonType": "date"
    },
    "is_used": {
      "bsonType": [
        "bool",
        "null"
      ]
    }
  },
  "required": [
    "_id",
    "token_value",
    "expired_at"
  ]
});
ensureIndex("EMAIL_VERIFICATION_TOKENS", {"token_value":1}, {"unique":true});
ensureIndex("EMAIL_VERIFICATION_TOKENS", {"expired_at":1}, {"expireAfterSeconds":0});

// ---------- USER_SESSIONS ----------
ensureCollection("USER_SESSIONS", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "user_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "refresh_token": {
      "bsonType": "string"
    },
    "is_revoked": {
      "bsonType": [
        "bool",
        "null"
      ]
    },
    "expires_at": {
      "bsonType": "date"
    }
  },
  "required": [
    "_id",
    "refresh_token",
    "expires_at"
  ]
});
ensureIndex("USER_SESSIONS", {"refresh_token":1}, {"unique":true});
ensureIndex("USER_SESSIONS", {"expires_at":1}, {"expireAfterSeconds":0});
ensureIndex("USER_SESSIONS", {"user_id":1}, {});

// ---------- PASSWORD_RESET_TOKENS ----------
ensureCollection("PASSWORD_RESET_TOKENS", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "user_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "token_value": {
      "bsonType": "string"
    },
    "expired_at": {
      "bsonType": "date"
    },
    "is_used": {
      "bsonType": [
        "bool",
        "null"
      ]
    }
  },
  "required": [
    "_id",
    "token_value",
    "expired_at"
  ]
});
ensureIndex("PASSWORD_RESET_TOKENS", {"token_value":1}, {"unique":true});
ensureIndex("PASSWORD_RESET_TOKENS", {"expired_at":1}, {"expireAfterSeconds":0});

// ---------- TUTOR_PROFILES ----------
ensureCollection("TUTOR_PROFILES", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "user_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "headline": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "bio": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "avatar_url": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "cover_url": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "address": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "is_address_hidden": {
      "bsonType": [
        "bool",
        "null"
      ]
    },
    "is_complete": {
      "bsonType": [
        "bool",
        "null"
      ]
    },
    "availability_status": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "AVAILABLE",
        "NOT_AVAILABLE",
        null
      ]
    },
    "average_rating": {
      "bsonType": [
        "double",
        "null"
      ]
    },
    "experiences": {
      "bsonType": [
        "array",
        "null"
      ],
      "items": {
        "bsonType": "object",
        "properties": {
          "title": {
            "bsonType": "string"
          },
          "company": {
            "bsonType": [
              "string",
              "null"
            ]
          },
          "start_date": {
            "bsonType": [
              "date",
              "null"
            ]
          },
          "end_date": {
            "bsonType": [
              "date",
              "null"
            ]
          }
        },
        "required": [
          "title"
        ]
      }
    },
    "achievements": {
      "bsonType": [
        "array",
        "null"
      ],
      "items": {
        "bsonType": "object",
        "properties": {
          "title": {
            "bsonType": "string"
          },
          "description": {
            "bsonType": [
              "string",
              "null"
            ]
          }
        },
        "required": [
          "title"
        ]
      }
    },
    "educations": {
      "bsonType": [
        "array",
        "null"
      ],
      "items": {
        "bsonType": "object",
        "properties": {
          "school": {
            "bsonType": "string"
          },
          "degree": {
            "bsonType": [
              "string",
              "null"
            ]
          },
          "graduation_year": {
            "bsonType": [
              "int",
              "null"
            ]
          },
          "description": {
            "bsonType": [
              "string",
              "null"
            ]
          }
        },
        "required": [
          "school"
        ]
      }
    }
  },
  "required": [
    "_id"
  ]
});
ensureIndex("TUTOR_PROFILES", {"user_id":1}, {"unique":true,"partialFilterExpression":{"user_id":{"$type":"objectId"}}});

// ---------- SAVED_SEARCHES ----------
ensureCollection("SAVED_SEARCHES", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "user_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "search_name": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "filter_criteria_json": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "created_at": {
      "bsonType": [
        "date",
        "null"
      ]
    }
  },
  "required": [
    "_id"
  ]
});

// ---------- REVIEWS ----------
ensureCollection("REVIEWS", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "tutor_profile_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "rating": {
      "bsonType": [
        "int",
        "null"
      ]
    },
    "comment": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "created_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "agreement_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "parent_user_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "knowledge_rating": {
      "bsonType": [
        "int",
        "null"
      ]
    },
    "punctuality_rating": {
      "bsonType": [
        "int",
        "null"
      ]
    },
    "communication_rating": {
      "bsonType": [
        "int",
        "null"
      ]
    },
    "tutor_reply": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "replied_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "status": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "APPROVED",
        "PENDING_MODERATION",
        "REJECTED",
        null
      ]
    },
    "updated_at": {
      "bsonType": [
        "date",
        "null"
      ]
    }
  },
  "required": [
    "_id"
  ]
});
ensureIndex("REVIEWS", {"agreement_id":1}, {"unique":true,"partialFilterExpression":{"agreement_id":{"$type":"objectId"}}});

// ---------- TUTOR_POSTS ----------
ensureCollection("TUTOR_POSTS", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "profile_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "title": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "subject_name": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "grade_level": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "teaching_mode": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "ONLINE",
        "OFFLINE",
        "HYBRID",
        null
      ]
    },
    "price": {
      "bsonType": [
        "decimal",
        "null"
      ]
    },
    "schedule": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "description": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "image_urls": {
      "bsonType": [
        "array",
        "null"
      ],
      "items": {
        "bsonType": "string"
      }
    },
    "status": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "DRAFT",
        "PUBLISHED",
        "PENDING_MODERATION",
        "HIDDEN",
        "DELETED",
        null
      ]
    },
    "created_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "updated_at": {
      "bsonType": [
        "date",
        "null"
      ]
    }
  },
  "required": [
    "_id"
  ]
});
ensureIndex("TUTOR_POSTS", {"status":1,"created_at":1}, {});
ensureIndex("TUTOR_POSTS", {"profile_id":1}, {});

// ---------- PARENT_REQUESTS ----------
ensureCollection("PARENT_REQUESTS", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "parent_user_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "title": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "subject_name": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "grade_level": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "teaching_mode": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "ONLINE",
        "OFFLINE",
        "HYBRID",
        null
      ]
    },
    "budget": {
      "bsonType": [
        "decimal",
        "null"
      ]
    },
    "schedule": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "description": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "location_address": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "image_urls": {
      "bsonType": [
        "array",
        "null"
      ],
      "items": {
        "bsonType": "string"
      }
    },
    "status": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "DRAFT",
        "PENDING_MODERATION",
        "OPEN",
        "IN_PROGRESS",
        "CLOSED",
        "CANCELLED",
        "EXPIRED",
        null
      ]
    },
    "created_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "updated_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "student_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "tutor_requirements": {
      "bsonType": [
        "string",
        "null"
      ]
    }
  },
  "required": [
    "_id"
  ]
});
ensureIndex("PARENT_REQUESTS", {"status":1,"created_at":1}, {});
ensureIndex("PARENT_REQUESTS", {"parent_user_id":1}, {});

// ---------- AI_SUGGESTIONS ----------
ensureCollection("AI_SUGGESTIONS", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "request_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "tutor_post_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "tutor_profile_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "match_score": {
      "bsonType": [
        "double",
        "null"
      ]
    },
    "ai_reason": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "weights_json": {
      "bsonType": [
        "object",
        "null"
      ]
    },
    "cached_until": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "created_at": {
      "bsonType": [
        "date",
        "null"
      ]
    }
  },
  "required": [
    "_id"
  ]
});
ensureIndex("AI_SUGGESTIONS", {"cached_until":1}, {"expireAfterSeconds":0});
ensureIndex("AI_SUGGESTIONS", {"request_id":1}, {});

// ---------- CONVERSATIONS ----------
ensureCollection("CONVERSATIONS", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "parent_user_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "tutor_profile_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "is_active": {
      "bsonType": [
        "bool",
        "null"
      ]
    },
    "created_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "request_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "class_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "type": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "DIRECT",
        "CLASS_GROUP_CHAT",
        null
      ]
    },
    "updated_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "read_states": {
      "bsonType": [
        "array",
        "null"
      ],
      "items": {
        "bsonType": "object",
        "properties": {
          "user_id": {
            "bsonType": [
              "objectId",
              "null"
            ]
          },
          "last_read_message_id": {
            "bsonType": [
              "objectId",
              "null"
            ]
          },
          "read_at": {
            "bsonType": [
              "date",
              "null"
            ]
          }
        }
      }
    }
  },
  "required": [
    "_id"
  ]
});
ensureIndex("CONVERSATIONS", {"class_id":1}, {"unique":true,"partialFilterExpression":{"class_id":{"$type":"objectId"}}});

// ---------- APPLY_REQUESTS ----------
ensureCollection("APPLY_REQUESTS", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "request_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "tutor_profile_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "note": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "match_score": {
      "bsonType": [
        "double",
        "null"
      ]
    },
    "status": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "PENDING",
        "CONTINUED",
        "SKIPPED",
        "WITHDRAWN",
        null
      ]
    },
    "created_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "updated_at": {
      "bsonType": [
        "date",
        "null"
      ]
    }
  },
  "required": [
    "_id"
  ]
});
ensureIndex("APPLY_REQUESTS", {"request_id":1,"tutor_profile_id":1}, {"unique":true});

// ---------- BOOKMARKED_REQUESTS ----------
ensureCollection("BOOKMARKED_REQUESTS", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "tutor_profile_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "request_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "created_at": {
      "bsonType": [
        "date",
        "null"
      ]
    }
  },
  "required": [
    "_id"
  ]
});
ensureIndex("BOOKMARKED_REQUESTS", {"tutor_profile_id":1,"request_id":1}, {"unique":true});

// ---------- AI_POST_SUGGESTIONS ----------
ensureCollection("AI_POST_SUGGESTIONS", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "tutor_profile_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "request_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "match_score": {
      "bsonType": [
        "double",
        "null"
      ]
    },
    "ai_reason": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "cached_until": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "created_at": {
      "bsonType": [
        "date",
        "null"
      ]
    }
  },
  "required": [
    "_id"
  ]
});
ensureIndex("AI_POST_SUGGESTIONS", {"cached_until":1}, {"expireAfterSeconds":0});
ensureIndex("AI_POST_SUGGESTIONS", {"tutor_profile_id":1}, {});

// ---------- TUTOR_INVITATIONS ----------
ensureCollection("TUTOR_INVITATIONS", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "parent_user_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "tutor_profile_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "request_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "message": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "status": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "PENDING",
        "ACCEPTED",
        "DECLINED",
        "CANCELLED",
        null
      ]
    },
    "created_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "updated_at": {
      "bsonType": [
        "date",
        "null"
      ]
    }
  },
  "required": [
    "_id"
  ]
});
ensureIndex("TUTOR_INVITATIONS", {"request_id":1,"tutor_profile_id":1}, {"unique":true});

// ---------- TUTORING_AGREEMENTS ----------
ensureCollection("TUTORING_AGREEMENTS", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "conversation_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "proposer_user_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "accepted_by_user_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "agreed_subject": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "agreed_schedule": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "agreed_price": {
      "bsonType": [
        "decimal",
        "null"
      ]
    },
    "status": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "DRAFT",
        "PENDING",
        "CONFIRMED",
        "REJECTED",
        "CANCELLED",
        null
      ]
    },
    "created_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "updated_at": {
      "bsonType": [
        "date",
        "null"
      ]
    }
  },
  "required": [
    "_id"
  ]
});

// ---------- PAYMENT_ORDERS ----------
ensureCollection("PAYMENT_ORDERS", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "order_code": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "user_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "item_type": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "PLAN_UPGRADE",
        "CREDIT_PACK",
        null
      ]
    },
    "plan_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "pack_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "quantity": {
      "bsonType": [
        "int",
        "null"
      ]
    },
    "duration_months": {
      "bsonType": [
        "int",
        "null"
      ]
    },
    "amount": {
      "bsonType": [
        "decimal",
        "null"
      ]
    },
    "payment_method": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "VIETQR",
        "ATM_CARD",
        "CREDIT_CARD",
        null
      ]
    },
    "status": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "PENDING",
        "SUCCESS",
        "FAILED",
        "CANCELLED",
        "EXPIRED",
        null
      ]
    },
    "ipn_signature": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "paid_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "created_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "receipt": {
      "bsonType": [
        "object",
        "null"
      ],
      "properties": {
        "receipt_url": {
          "bsonType": [
            "string",
            "null"
          ]
        },
        "created_at": {
          "bsonType": [
            "date",
            "null"
          ]
        }
      }
    }
  },
  "required": [
    "_id"
  ]
});
ensureIndex("PAYMENT_ORDERS", {"order_code":1}, {"unique":true,"partialFilterExpression":{"order_code":{"$type":"string"}}});

// ---------- PLANS ----------
ensureCollection("PLANS", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "target_role": {
      "bsonType": "string",
      "enum": [
        "TUTOR",
        "PARENT"
      ]
    },
    "name": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "monthly_price": {
      "bsonType": [
        "decimal",
        "null"
      ]
    },
    "monthly_credits": {
      "bsonType": [
        "int",
        "null"
      ]
    },
    "ai_quota": {
      "bsonType": [
        "int",
        "null"
      ]
    },
    "sms_reminders_enabled": {
      "bsonType": [
        "bool",
        "null"
      ]
    },
    "is_active": {
      "bsonType": [
        "bool",
        "null"
      ]
    },
    "max_classrooms": {
      "bsonType": [
        "int",
        "null"
      ]
    }
  },
  "required": [
    "_id",
    "target_role"
  ]
});

// ---------- CREDIT_PACKS ----------
ensureCollection("CREDIT_PACKS", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "target_role": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "TUTOR",
        "PARENT",
        null
      ]
    },
    "name": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "credit_amount": {
      "bsonType": [
        "int",
        "null"
      ]
    },
    "price": {
      "bsonType": [
        "decimal",
        "null"
      ]
    },
    "is_active": {
      "bsonType": [
        "bool",
        "null"
      ]
    }
  },
  "required": [
    "_id"
  ]
});

// ---------- CREDIT_TRANSACTIONS ----------
ensureCollection("CREDIT_TRANSACTIONS", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "user_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "amount": {
      "bsonType": "int"
    },
    "type": {
      "bsonType": "string",
      "enum": [
        "MONTHLY_GRANT",
        "PURCHASE",
        "USED_APPLY",
        "USED_INVITATION",
        "EXPIRED_GRANT"
      ]
    },
    "related_apply_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "related_invitation_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "expires_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "created_at": {
      "bsonType": [
        "date",
        "null"
      ]
    }
  },
  "required": [
    "_id",
    "amount",
    "type"
  ]
});
ensureIndex("CREDIT_TRANSACTIONS", {"user_id":1,"created_at":1}, {});

// ---------- CLASSROOMS ----------
ensureCollection("CLASSROOMS", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "tutor_profile_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "agreement_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "name": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "subject": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "grade": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "description": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "capacity": {
      "bsonType": [
        "int",
        "null"
      ]
    },
    "join_code": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "invite_link": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "status": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "ACTIVE",
        "ARCHIVED",
        null
      ]
    },
    "created_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "updated_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "topics": {
      "bsonType": [
        "array",
        "null"
      ],
      "items": {
        "bsonType": "object",
        "properties": {
          "_id": {
            "bsonType": [
              "objectId",
              "null"
            ]
          },
          "name": {
            "bsonType": [
              "string",
              "null"
            ]
          },
          "created_at": {
            "bsonType": [
              "date",
              "null"
            ]
          }
        }
      }
    }
  },
  "required": [
    "_id"
  ]
});
ensureIndex("CLASSROOMS", {"join_code":1}, {"unique":true,"partialFilterExpression":{"join_code":{"$type":"string"}}});
ensureIndex("CLASSROOMS", {"invite_link":1}, {"unique":true,"partialFilterExpression":{"invite_link":{"$type":"string"}}});

// ---------- CLASS_MEMBERS ----------
ensureCollection("CLASS_MEMBERS", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "class_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "user_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "joined_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "status": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "ACTIVE",
        "REMOVED",
        null
      ]
    },
    "removal_reason": {
      "bsonType": [
        "string",
        "null"
      ]
    }
  },
  "required": [
    "_id"
  ]
});
ensureIndex("CLASS_MEMBERS", {"class_id":1,"user_id":1}, {"unique":true});
ensureIndex("CLASS_MEMBERS", {"user_id":1}, {});

// ---------- CLASS_ANNOUNCEMENTS ----------
ensureCollection("CLASS_ANNOUNCEMENTS", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "class_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "author_profile_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "content": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "is_pinned": {
      "bsonType": [
        "bool",
        "null"
      ]
    },
    "created_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "updated_at": {
      "bsonType": [
        "date",
        "null"
      ]
    }
  },
  "required": [
    "_id"
  ]
});

// ---------- CLASS_MATERIALS ----------
ensureCollection("CLASS_MATERIALS", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "class_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "topic_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "uploader_profile_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "title": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "material_type": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "DOCUMENT",
        "SLIDE",
        "VIDEO",
        "LINK",
        null
      ]
    },
    "file_url": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "file_size": {
      "bsonType": [
        "int",
        "null"
      ]
    },
    "visibility": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "ALL_MEMBERS",
        "STUDENTS_ONLY",
        null
      ]
    },
    "created_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "updated_at": {
      "bsonType": [
        "date",
        "null"
      ]
    }
  },
  "required": [
    "_id"
  ]
});

// ---------- ASSIGNMENTS ----------
ensureCollection("ASSIGNMENTS", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "class_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "creator_profile_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "title": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "instructions": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "is_ai_generated": {
      "bsonType": [
        "bool",
        "null"
      ]
    },
    "status": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "DRAFT",
        "PUBLISHED",
        null
      ]
    },
    "due_date": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "allow_late_submission": {
      "bsonType": [
        "bool",
        "null"
      ]
    },
    "allow_resubmission": {
      "bsonType": [
        "bool",
        "null"
      ]
    },
    "total_points": {
      "bsonType": [
        "int",
        "null"
      ]
    },
    "published_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "results_published_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "created_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "updated_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "questions": {
      "bsonType": [
        "array",
        "null"
      ],
      "items": {
        "bsonType": "object",
        "properties": {
          "_id": {
            "bsonType": [
              "objectId",
              "null"
            ]
          },
          "question_number": {
            "bsonType": [
              "int",
              "null"
            ]
          },
          "question_type": {
            "bsonType": [
              "string",
              "null"
            ],
            "enum": [
              "MULTIPLE_CHOICE",
              "SHORT_ANSWER",
              "FILE_UPLOAD",
              null
            ]
          },
          "content": {
            "bsonType": [
              "string",
              "null"
            ]
          },
          "options": {
            "bsonType": [
              "array",
              "null"
            ],
            "items": {
              "bsonType": "string"
            }
          },
          "correct_answer": {
            "bsonType": [
              "string",
              "null"
            ]
          },
          "points": {
            "bsonType": [
              "int",
              "null"
            ]
          }
        }
      }
    },
    "attachments": {
      "bsonType": [
        "array",
        "null"
      ],
      "items": {
        "bsonType": "object",
        "properties": {
          "material_id": {
            "bsonType": [
              "objectId",
              "null"
            ]
          }
        }
      }
    }
  },
  "required": [
    "_id"
  ]
});

// ---------- ASSIGNMENT_SUBMISSIONS ----------
ensureCollection("ASSIGNMENT_SUBMISSIONS", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "assignment_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "student_user_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "attempt_number": {
      "bsonType": [
        "int",
        "null"
      ]
    },
    "status": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "IN_PROGRESS",
        "SUBMITTED",
        "GRADED",
        null
      ]
    },
    "timeliness": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "ON_TIME",
        "LATE",
        null
      ]
    },
    "provisional_score": {
      "bsonType": [
        "double",
        "null"
      ]
    },
    "final_score": {
      "bsonType": [
        "double",
        "null"
      ]
    },
    "overall_feedback": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "submitted_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "graded_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "answers": {
      "bsonType": [
        "array",
        "null"
      ],
      "items": {
        "bsonType": "object",
        "properties": {
          "question_id": {
            "bsonType": [
              "objectId",
              "null"
            ]
          },
          "text_response": {
            "bsonType": [
              "string",
              "null"
            ]
          },
          "file_url": {
            "bsonType": [
              "string",
              "null"
            ]
          },
          "file_size": {
            "bsonType": [
              "int",
              "null"
            ]
          },
          "score": {
            "bsonType": [
              "double",
              "null"
            ]
          },
          "is_auto_graded": {
            "bsonType": [
              "bool",
              "null"
            ]
          },
          "is_overridden": {
            "bsonType": [
              "bool",
              "null"
            ]
          },
          "comment": {
            "bsonType": [
              "string",
              "null"
            ]
          }
        }
      }
    }
  },
  "required": [
    "_id"
  ]
});

// ---------- RECURRING_RULES ----------
ensureCollection("RECURRING_RULES", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "class_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "days_of_week": {
      "bsonType": [
        "array",
        "null"
      ],
      "items": {
        "bsonType": "string"
      }
    },
    "start_time": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "duration_minutes": {
      "bsonType": [
        "int",
        "null"
      ]
    },
    "end_date": {
      "bsonType": [
        "date",
        "null"
      ]
    }
  },
  "required": [
    "_id"
  ]
});

// ---------- CLASS_SESSIONS ----------
ensureCollection("CLASS_SESSIONS", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "class_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "tutor_profile_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "rule_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "title": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "start_time": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "end_time": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "meeting_link": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "status": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "SCHEDULED",
        "CANCELLED",
        "COMPLETED",
        null
      ]
    },
    "created_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "updated_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "attendance": {
      "bsonType": [
        "array",
        "null"
      ],
      "items": {
        "bsonType": "object",
        "properties": {
          "student_user_id": {
            "bsonType": [
              "objectId",
              "null"
            ]
          },
          "status": {
            "bsonType": [
              "string",
              "null"
            ],
            "enum": [
              "PRESENT",
              "ABSENT",
              "LATE",
              null
            ]
          },
          "comment": {
            "bsonType": [
              "string",
              "null"
            ]
          },
          "marked_at": {
            "bsonType": [
              "date",
              "null"
            ]
          }
        }
      }
    }
  },
  "required": [
    "_id"
  ]
});
ensureIndex("CLASS_SESSIONS", {"class_id":1,"start_time":1}, {});
ensureIndex("CLASS_SESSIONS", {"tutor_profile_id":1,"start_time":1}, {});

// ---------- SCHEDULE_CHANGE_REQUESTS ----------
ensureCollection("SCHEDULE_CHANGE_REQUESTS", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "session_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "requester_user_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "responder_user_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "request_type": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "MOVE",
        "CANCEL",
        null
      ]
    },
    "proposed_start_time": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "proposed_end_time": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "reason": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "status": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "PENDING",
        "APPROVED",
        "REJECTED",
        "WITHDRAWN",
        null
      ]
    },
    "response_comment": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "responded_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "created_at": {
      "bsonType": [
        "date",
        "null"
      ]
    }
  },
  "required": [
    "_id"
  ]
});

// ---------- SESSION_REMINDERS ----------
ensureCollection("SESSION_REMINDERS", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "session_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "user_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "channel": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "EMAIL",
        "SMS",
        null
      ]
    },
    "trigger_time": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "BEFORE_24H",
        "BEFORE_30M",
        null
      ]
    },
    "scheduled_for": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "status": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "PENDING",
        "SENT",
        "FAILED",
        null
      ]
    },
    "sent_at": {
      "bsonType": [
        "date",
        "null"
      ]
    }
  },
  "required": [
    "_id"
  ]
});
ensureIndex("SESSION_REMINDERS", {"status":1,"scheduled_for":1}, {});

// ---------- USER_CALENDAR_TOKENS ----------
ensureCollection("USER_CALENDAR_TOKENS", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "user_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "provider": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "access_token": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "refresh_token": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "google_calendar_id": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "is_connected": {
      "bsonType": [
        "bool",
        "null"
      ]
    },
    "last_synced_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "expires_at": {
      "bsonType": [
        "date",
        "null"
      ]
    }
  },
  "required": [
    "_id"
  ]
});
ensureIndex("USER_CALENDAR_TOKENS", {"user_id":1}, {"unique":true,"partialFilterExpression":{"user_id":{"$type":"objectId"}}});

// ---------- SESSION_CALENDAR_SYNC ----------
ensureCollection("SESSION_CALENDAR_SYNC", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "session_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "user_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "google_event_id": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "sync_status": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "SYNCED",
        "PENDING",
        "FAILED",
        null
      ]
    },
    "last_error": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "synced_at": {
      "bsonType": [
        "date",
        "null"
      ]
    }
  },
  "required": [
    "_id"
  ]
});

// ---------- MESSAGES ----------
ensureCollection("MESSAGES", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "conversation_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "sender_user_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "message_type": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "TEXT",
        "IMAGE",
        "FILE",
        "CONTACT_CARD",
        null
      ]
    },
    "content": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "created_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "attachments": {
      "bsonType": [
        "array",
        "null"
      ],
      "items": {
        "bsonType": "object",
        "properties": {
          "file_url": {
            "bsonType": [
              "string",
              "null"
            ]
          },
          "file_name": {
            "bsonType": [
              "string",
              "null"
            ]
          },
          "file_size": {
            "bsonType": [
              "int",
              "null"
            ]
          },
          "mime_type": {
            "bsonType": [
              "string",
              "null"
            ]
          }
        }
      }
    }
  },
  "required": [
    "_id"
  ]
});
ensureIndex("MESSAGES", {"conversation_id":1,"created_at":1}, {});

// ---------- NOTIFICATIONS ----------
ensureCollection("NOTIFICATIONS", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "recipient_user_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "category": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "APPLICATION",
        "INVITATION",
        "CONVERSATION",
        "SESSION",
        "SCHEDULE_CHANGE",
        "ASSIGNMENT",
        "SYSTEM",
        null
      ]
    },
    "title": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "body": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "target_type": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "ASSIGNMENT",
        "SESSION",
        "CONVERSATION",
        "CLASSROOM",
        "CLASS_MATERIAL",
        null
      ]
    },
    "target_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "is_read": {
      "bsonType": [
        "bool",
        "null"
      ]
    },
    "read_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "created_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "delivery_logs": {
      "bsonType": [
        "array",
        "null"
      ],
      "items": {
        "bsonType": "object",
        "properties": {
          "recipient_user_id": {
            "bsonType": [
              "objectId",
              "null"
            ]
          },
          "channel": {
            "bsonType": [
              "string",
              "null"
            ],
            "enum": [
              "IN_APP",
              "EMAIL",
              "SMS",
              null
            ]
          },
          "status": {
            "bsonType": [
              "string",
              "null"
            ],
            "enum": [
              "PENDING",
              "SENT",
              "FAILED",
              "FALLBACK_EMAIL",
              null
            ]
          },
          "error_message": {
            "bsonType": [
              "string",
              "null"
            ]
          },
          "dispatched_at": {
            "bsonType": [
              "date",
              "null"
            ]
          }
        }
      }
    }
  },
  "required": [
    "_id"
  ]
});
ensureIndex("NOTIFICATIONS", {"recipient_user_id":1,"is_read":1,"created_at":1}, {});

// ---------- PARENT_CHILD_LINKS ----------
ensureCollection("PARENT_CHILD_LINKS", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "parent_user_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "student_user_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "status": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "PENDING",
        "ACCEPTED",
        "DECLINED",
        null
      ]
    },
    "created_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "updated_at": {
      "bsonType": [
        "date",
        "null"
      ]
    }
  },
  "required": [
    "_id"
  ]
});
ensureIndex("PARENT_CHILD_LINKS", {"parent_user_id":1,"student_user_id":1}, {"unique":true});

// ---------- ADMIN_AUDIT_LOGS ----------
ensureCollection("ADMIN_AUDIT_LOGS", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "admin_user_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "target_user_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "action": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "MODERATE_CONTENT",
        "WARN_USER",
        "LOCK_USER",
        "UNLOCK_USER",
        "UPDATE_PLAN",
        "UPDATE_SETTINGS",
        null
      ]
    },
    "reason": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "details_json": {
      "bsonType": [
        "object",
        "null"
      ]
    },
    "ip_address": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "created_at": {
      "bsonType": [
        "date",
        "null"
      ]
    }
  },
  "required": [
    "_id"
  ]
});

// ---------- CONTENT_REPORTS ----------
ensureCollection("CONTENT_REPORTS", {
  "bsonType": "object",
  "properties": {
    "_id": {
      "bsonType": "objectId"
    },
    "reporter_user_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "target_type": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "POST",
        "REQUEST",
        "REVIEW",
        "MESSAGE",
        "USER",
        "CLASSROOM",
        null
      ]
    },
    "target_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "reason": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "severity": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "LOW",
        "MEDIUM",
        "HIGH",
        "CRITICAL",
        null
      ]
    },
    "status": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "PENDING",
        "INVESTIGATING",
        "RESOLVED",
        "DISMISSED",
        null
      ]
    },
    "action_taken": {
      "bsonType": [
        "string",
        "null"
      ],
      "enum": [
        "NONE",
        "WARNING_SENT",
        "CONTENT_HIDDEN",
        "CONTENT_REMOVED",
        "USER_BANNED",
        null
      ]
    },
    "admin_note": {
      "bsonType": [
        "string",
        "null"
      ]
    },
    "resolved_by_admin_id": {
      "bsonType": [
        "objectId",
        "null"
      ]
    },
    "resolved_at": {
      "bsonType": [
        "date",
        "null"
      ]
    },
    "created_at": {
      "bsonType": [
        "date",
        "null"
      ]
    }
  },
  "required": [
    "_id"
  ]
});
ensureIndex("CONTENT_REPORTS", {"status":1,"severity":1}, {});
ensureIndex("CONTENT_REPORTS", {"target_type":1,"target_id":1}, {});

// ---------- Index bổ sung (field nhúng, truy vấn chính) ----------
ensureIndex("User", {"google_account.google_id":1}, {"unique":true,"partialFilterExpression":{"google_account.google_id":{"$type":"string"}}});
ensureIndex("TUTOR_PROFILES", {"availability_status":1,"average_rating":-1}, {});
ensureIndex("APPLY_REQUESTS", {"tutor_profile_id":1,"created_at":-1}, {});
ensureIndex("TUTOR_INVITATIONS", {"tutor_profile_id":1,"status":1}, {});
ensureIndex("CONVERSATIONS", {"parent_user_id":1}, {});
ensureIndex("CONVERSATIONS", {"tutor_profile_id":1}, {});
ensureIndex("CLASSROOMS", {"tutor_profile_id":1}, {});
ensureIndex("ASSIGNMENTS", {"class_id":1,"status":1}, {});
ensureIndex("ASSIGNMENT_SUBMISSIONS", {"assignment_id":1,"student_user_id":1,"attempt_number":-1}, {});
ensureIndex("CLASS_MATERIALS", {"class_id":1,"topic_id":1}, {});
ensureIndex("PAYMENT_ORDERS", {"user_id":1,"created_at":-1}, {});
ensureIndex("REVIEWS", {"tutor_profile_id":1,"created_at":-1}, {});
ensureIndex("SCHEDULE_CHANGE_REQUESTS", {"session_id":1,"status":1}, {});

print('Xong: 37 collection, 50 index trên DB ' + DB_NAME + '.');
