1
사용가능 서비스
EC2, S3, Cognito
2
리전
서울 (ap-northeast-2)
베드락은 미국 모든 리전 (베드락 모델 인스턴스 프로필은 us로 시작)
3
EC2
인스턴스 타입: t3.nano ~ t3.medium
EC2 인스턴스 프로필을 SafeInstanceProfile-sgu-mong으로 교체
4
S3
버킷 이름은 항상 sgu-mong으로 시작
5
Cognito

6
Access Key
절대 발급 불가, IAM Role 사용
EC2용: SafeInstanceProfile-sgu-mong
EC2 외(예. Lambda): SafeRole-sgu-mong

주의사항 상세

1. 내가 생성한 리소스만 중단, 시작, 삭제할 수 있어요.
2. 지정된 리전 외의 리전에서는 활동이 제한됩니다.
    1. 단, Bedrock은 주요 리전인 미국 전 리전에서 사용 가능합니다.
    2. 뭔가 잘 안되면 제일 먼저 리전을 확인해 주세요.

1. EC2는 아래 타입만 가능해요. 
    1. t3.nano ~ t3.medium
    2. 인스턴스 생성 후 반드시 인스턴스 프로필 설정을 해 주세요.

