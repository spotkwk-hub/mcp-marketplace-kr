export type SecurityCert = 'ISMS-P' | 'ISO27001' | 'CC인증' | 'CSAP';
export type PricingModel = 'free' | 'freemium' | 'paid' | 'enterprise';
export type Category =
  | '국내서비스'
  | 'ERP·회계'
  | '금융·세금'
  | '법규·규정'
  | '한국어AI'
  | '공공데이터'
  | '커머스'
  | '보안';

export interface MCPTool {
  name: string;
  description: string;
}

export interface MCPServer {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  longDescription: string;
  category: Category;
  tags: string[];
  author: string;
  authorVerified: boolean;
  version: string;
  stars: number;
  installs: number;
  pricing: PricingModel;
  priceKRW?: number;
  certs: SecurityCert[];
  apiDocs: string;
  githubUrl?: string;
  featured: boolean;
  publishedAt: string;
  updatedAt: string;
  likes: number;
  tools: MCPTool[];
  /** 현재 세션에 실제 연결·검증된 MCP 서버 */
  isLive?: boolean;
  /** 플랫폼이 직접 제작한 시드 MCP 서버 */
  isSeed?: boolean;
}

export interface ProviderSubmission {
  name: string;
  nameEn: string;
  category: Category;
  description: string;
  githubUrl: string;
  apiDocsUrl: string;
  pricing: PricingModel;
  priceKRW?: number;
  authorName: string;
  authorEmail: string;
  businessNumber: string;
}
