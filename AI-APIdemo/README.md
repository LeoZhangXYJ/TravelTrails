# AI-API调用说明

## 输入
1. 读取JSON格式的{城市, 国家}对的列表
2. 进行格式处理
3. 进行相应的提示词工程，具体如下
```text
你是一位资深旅行推荐专家（Travel Recommendation Expert）。
        用户已访问城市列表如下（Visited Cities）：
        {cities_prompt}

        请先根据以下维度，自动从已访问城市中推断用户的旅行偏好（Preferences）：
        1. 地理区域（Region）：例如欧洲／亚太／美洲偏好
        2. 文化类型（Culture）：历史古迹／现代艺术／宗教遗迹等
        3. 活动属性（Activities）：如自然风光／城市漫游／夜生活等
        4. 季节气候（Seasonality）：避暑／滑雪／樱花季等
        5. 出行风格（Style）：深度慢游／打卡速览／美食探索

        然后，基于上述推断出的偏好，推荐5个新的旅游城市。
        输出请采用 JSON 数组，每项包含以下字段：
        ```json
        [
          {{
            "city": "推荐城市名称",
            "country": "所属国家",
            "inferred_preferences": ["推断偏好项1", "推断偏好项2"],
            "reason": "简要推荐理由（不超30字）"
          }},
          ...
        ]
        ```
        请直接返回JSON，不要包含任何其他解释文字。
```

## 测试例子说明
1. visitCity.json为历史轨迹爱好者例子
2. visitCity2.json为现代城市、摩登、夜生活爱好者例子
3. visitCity3.json将城市局限在中国，测试是否会均返回中国城市的例子。  

## 测试方法说明
1. python运行
2. 浏览器中查找`http://localhost:8000/test-api`即可