import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

// ================= USER MODEL =================
export class User extends Model {
  declare id: string;
  declare email: string;
  declare name: string;
  declare password: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}
User.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
  },
  { sequelize, modelName: 'User', tableName: 'users', timestamps: true }
);

// ================= BOARD MODEL =================
export class Board extends Model {
  declare id: string;
  declare title: string;
  declare name: string;
  declare description: string | null;
  declare ownerId: string;
  declare background: 'blue' | 'orange' | 'green' | 'red' | 'purple' | 'pink' | 'lime' | 'sky';
  declare isArchived: boolean;
  declare archived: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}
Board.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    name: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('title');
      },
      set(val: string) {
        this.setDataValue('title', val);
      },
    },
    description: { type: DataTypes.TEXT, allowNull: true },
    ownerId: { type: DataTypes.UUID, allowNull: false },
    background: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'blue',
    },
    isArchived: { type: DataTypes.BOOLEAN, defaultValue: false },
    archived: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('isArchived');
      },
      set(val: boolean) {
        this.setDataValue('isArchived', val);
      },
    },
  },
  { sequelize, modelName: 'Board', tableName: 'boards', timestamps: true }
);

// ================= BOARD MEMBER =================
export class BoardMember extends Model {
  declare id: string;
  declare boardId: string;
  declare userId: string;
  declare role: 'admin' | 'member';
}
BoardMember.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    boardId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    role: { type: DataTypes.ENUM('admin', 'member'), defaultValue: 'member' },
  },
  { sequelize, modelName: 'BoardMember', tableName: 'board_members', timestamps: true }
);

// ================= BOARD STAR =================
export class BoardStar extends Model {
  declare id: string;
  declare boardId: string;
  declare userId: string;
}
BoardStar.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    boardId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
  },
  { sequelize, modelName: 'BoardStar', tableName: 'board_stars', timestamps: true }
);

// ================= LIST MODEL =================
export class List extends Model {
  declare id: string;
  declare boardId: string;
  declare title: string;
  declare position: number;
  declare isArchived: boolean;
  declare wipLimit: number | null;
  declare color: string | null;
}
List.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    boardId: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    position: { type: DataTypes.DOUBLE, allowNull: false, defaultValue: 65535 },
    isArchived: { type: DataTypes.BOOLEAN, defaultValue: false },
    wipLimit: { type: DataTypes.INTEGER, allowNull: true },
    color: { type: DataTypes.STRING(16), allowNull: true },
  },
  { sequelize, modelName: 'List', tableName: 'lists', timestamps: true }
);

// ================= CARD MODEL =================
export class Card extends Model {
  declare id: string;
  declare listId: string;
  declare boardId: string;
  declare title: string;
  declare description: string | null;
  declare position: number;
  declare isArchived: boolean;
  declare dueDate: Date | null;
  declare dueComplete: boolean;
}
Card.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    listId: { type: DataTypes.UUID, allowNull: false },
    boardId: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    position: { type: DataTypes.DOUBLE, allowNull: false, defaultValue: 65535 },
    isArchived: { type: DataTypes.BOOLEAN, defaultValue: false },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    dueComplete: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { sequelize, modelName: 'Card', tableName: 'cards', timestamps: true }
);

export type LabelColorType =
  | 'green'
  | 'yellow'
  | 'orange'
  | 'red'
  | 'purple'
  | 'blue'
  | 'sky'
  | 'lime'
  | 'pink'
  | 'black';

// ================= LABEL MODEL =================
export class Label extends Model {
  declare id: string;
  declare boardId: string;
  declare name: string;
  declare color: LabelColorType;
}
Label.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    boardId: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, defaultValue: '' },
    color: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
  },
  { sequelize, modelName: 'Label', tableName: 'labels', timestamps: true }
);

// ================= CARD LABEL (JOIN TABLE) =================
export class CardLabel extends Model {
  declare cardId: string;
  declare labelId: string;
}
CardLabel.init(
  {
    cardId: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
    labelId: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
  },
  { sequelize, modelName: 'CardLabel', tableName: 'card_labels', timestamps: false }
);

// ================= CARD MEMBER (JOIN TABLE) =================
export class CardMember extends Model {
  declare cardId: string;
  declare userId: string;
}
CardMember.init(
  {
    cardId: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
  },
  { sequelize, modelName: 'CardMember', tableName: 'card_members', timestamps: false }
);

// ================= CHECKLIST MODEL =================
export class Checklist extends Model {
  declare id: string;
  declare cardId: string;
  declare title: string;
  declare position: number;
}
Checklist.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    cardId: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    position: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 65535 },
  },
  { sequelize, modelName: 'Checklist', tableName: 'checklists', timestamps: true }
);

// ================= CHECKLIST ITEM MODEL =================
export class ChecklistItem extends Model {
  declare id: string;
  declare checklistId: string;
  declare title: string;
  declare text: string;
  declare isCompleted: boolean;
  declare done: boolean;
  declare position: number;
}
ChecklistItem.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    checklistId: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    text: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('title');
      },
      set(val: string) {
        this.setDataValue('title', val);
      },
    },
    isCompleted: { type: DataTypes.BOOLEAN, defaultValue: false },
    done: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('isCompleted');
      },
      set(val: boolean) {
        this.setDataValue('isCompleted', val);
      },
    },
    position: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 65535 },
  },
  { sequelize, modelName: 'ChecklistItem', tableName: 'checklist_items', timestamps: true }
);

// ================= COMMENT MODEL =================
export class Comment extends Model {
  declare id: string;
  declare cardId: string;
  declare userId: string;
  declare content: string;
  declare text: string;
  declare editedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}
Comment.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    cardId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    text: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('content');
      },
      set(val: string) {
        this.setDataValue('content', val);
      },
    },
    editedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
  },
  { sequelize, modelName: 'Comment', tableName: 'comments', timestamps: true }
);

// ================= ATTACHMENT MODEL =================
export class Attachment extends Model {
  declare id: string;
  declare cardId: string;
  declare boardId: string;
  declare fileName: string;
  declare fileUrl: string;
  declare fileType: 'image' | 'video';
  declare mimeType: string;
  declare publicId: string | null;
  declare size: number;
  declare isCover: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}
Attachment.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    cardId: { type: DataTypes.UUID, allowNull: false },
    boardId: { type: DataTypes.UUID, allowNull: false },
    fileName: { type: DataTypes.STRING(255), allowNull: false },
    fileUrl: { type: DataTypes.TEXT, allowNull: false },
    fileType: { type: DataTypes.ENUM('image', 'video'), allowNull: false },
    mimeType: { type: DataTypes.STRING(100), allowNull: false },
    publicId: { type: DataTypes.STRING(255), allowNull: true },
    size: { type: DataTypes.INTEGER, defaultValue: 0 },
    isCover: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { sequelize, modelName: 'Attachment', tableName: 'attachments', timestamps: true }
);

// ================= RELATIONSHIPS =================
export class Activity extends Model {
  declare id: string;
  declare boardId: string;
  declare cardId: string | null;
  declare userId: string;
  declare type: string;
  declare data: Record<string, unknown>;
  declare readonly createdAt: Date;
}
Activity.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  boardId: { type: DataTypes.UUID, allowNull: false },
  cardId: { type: DataTypes.UUID, allowNull: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  type: { type: DataTypes.STRING(50), allowNull: false },
  data: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
}, { sequelize, modelName: 'Activity', tableName: 'activities', timestamps: true, updatedAt: false });
Activity.belongsTo(User, { foreignKey: 'userId', as: 'actor' });

User.hasMany(Board, { foreignKey: 'ownerId', as: 'ownedBoards' });
Board.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

Board.belongsToMany(User, { through: BoardMember, foreignKey: 'boardId', as: 'members' });
User.belongsToMany(Board, { through: BoardMember, foreignKey: 'userId', as: 'memberBoards' });

Board.hasMany(BoardStar, { foreignKey: 'boardId', as: 'stars' });
BoardStar.belongsTo(Board, { foreignKey: 'boardId' });
User.hasMany(BoardStar, { foreignKey: 'userId', as: 'starredBoards' });

Board.hasMany(List, { foreignKey: 'boardId', as: 'lists' });
List.belongsTo(Board, { foreignKey: 'boardId' });

List.hasMany(Card, { foreignKey: 'listId', as: 'cards' });
Card.belongsTo(List, { foreignKey: 'listId' });
Board.hasMany(Card, { foreignKey: 'boardId', as: 'cards' });
Card.belongsTo(Board, { foreignKey: 'boardId' });

Board.hasMany(Label, { foreignKey: 'boardId', as: 'labels' });
Label.belongsTo(Board, { foreignKey: 'boardId' });

Card.belongsToMany(Label, { through: CardLabel, foreignKey: 'cardId', as: 'labels' });
Label.belongsToMany(Card, { through: CardLabel, foreignKey: 'labelId', as: 'cards' });

Card.belongsToMany(User, { through: CardMember, foreignKey: 'cardId', as: 'members' });
User.belongsToMany(Card, { through: CardMember, foreignKey: 'userId', as: 'cards' });

Card.hasMany(Checklist, { foreignKey: 'cardId', as: 'checklists' });
Checklist.belongsTo(Card, { foreignKey: 'cardId' });

Checklist.hasMany(ChecklistItem, { foreignKey: 'checklistId', as: 'items' });
ChecklistItem.belongsTo(Checklist, { foreignKey: 'checklistId' });

Card.hasMany(Comment, { foreignKey: 'cardId', as: 'comments' });
Comment.belongsTo(Card, { foreignKey: 'cardId' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'author' });

Card.hasMany(Attachment, { foreignKey: 'cardId', as: 'attachments' });
Attachment.belongsTo(Card, { foreignKey: 'cardId' });
Board.hasMany(Attachment, { foreignKey: 'boardId', as: 'attachments' });
Attachment.belongsTo(Board, { foreignKey: 'boardId' });

export async function syncDatabase(force = false) {
  await sequelize.sync({ force });
  console.log('✅ Cơ sở dữ liệu PostgreSQL đã được đồng bộ hóa!');
}
