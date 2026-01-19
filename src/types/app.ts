/**
 * 应用状态类型定义
 */
export interface AppState {
  /** 当前选中的菜单项 */
  selectedMenu: string;
  /** 是否显示加载中 */
  loading: boolean;
  /** 全局错误信息 */
  error?: string;
}
