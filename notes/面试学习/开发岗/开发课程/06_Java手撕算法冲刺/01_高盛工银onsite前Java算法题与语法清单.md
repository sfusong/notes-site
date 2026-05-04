# 高盛工银 onsite Java coding 七天冲刺手册

## 定位

这份不是大厂算法大全，而是为这次 onsite 准备的 Java 手写最小题库。

目标：

- 半小时 3 道 Java coding 不露怯
- 基础题能快速识别类型
- Java 语法、集合类、数据结构写法重新熟起来
- 每题能讲思路、代码、复杂度

最终题库：

- 12 道主干题
- 4 个必要补充点：树递归遍历、`HashSet`、字符串双指针、递归返回值
- 实际练习项是 16 组，其中二叉树前 / 中 / 后序遍历是一组 3 个小模板

不要再盲目扩到 20 题。现在更重要的是每天重复手写。

---

## 每天一轮怎么练

每天按这个顺序走，不需要重新设计计划：

1. 先扫一遍“每天必须练的 Java 语法”，3 到 5 分钟。
2. 按“每天练习顺序”从第一轮写到第四轮。
3. 每题先不看答案写一遍，卡住再看“每天练的语法”。
4. 写完立刻对照“注意事项和易错点”自查。
5. 每题最后用 20 到 30 秒说一遍“现场讲法”。

每题最低合格标准：

- 能说出用什么数据结构。
- 能写出 Java 代码主体。
- 能处理空值、下标、栈空、链表断链这类基础边界。
- 能说时间复杂度和空间复杂度。

如果时间不够，优先保证第一轮和第二轮；第三轮、第四轮可以隔天轮换。

---

## 每天练习顺序

### 第一轮：必须闭眼写

1. LeetCode 1：Two Sum
2. LeetCode 20：Valid Parentheses
3. LeetCode 88：Merge Sorted Array
4. LeetCode 206：Reverse Linked List
5. LeetCode 704：Binary Search
6. LeetCode 26：Remove Duplicates from Sorted Array

### 第二轮：补齐数组、字符串、区间

1. LeetCode 387：First Unique Character
2. LeetCode 121：Best Time to Buy and Sell Stock
3. LeetCode 53：Maximum Subarray
4. LeetCode 56：Merge Intervals

### 第三轮：链表和树

1. LeetCode 141：Linked List Cycle
2. LeetCode 102：Binary Tree Level Order Traversal
3. LeetCode 144 / 94 / 145：二叉树前序 / 中序 / 后序遍历

### 第四轮：真正补语法缺口

1. LeetCode 217：Contains Duplicate
2. LeetCode 125：Valid Palindrome
3. LeetCode 104：Maximum Depth of Binary Tree

---

## 每天必须练的 Java 语法

### 1. 数组

```java
int[] nums;
int[][] intervals;
nums.length;
nums[i];
intervals[i][0];
intervals[i][1];
```

解释：

- `int[]` 是一维数组。
- `int[][]` 是二维数组，可以理解成“大数组里放小数组”。
- 数组长度用 `nums.length`，没有括号。
- 字符串长度才是 `s.length()`，有括号。

### 2. 字符串和字符

```java
String s;
s.length();
s.charAt(i);
s.toCharArray();
for (char c : s.toCharArray()) {
}
```

解释：

- `charAt(i)` 取字符串第 `i` 个字符。
- `toCharArray()` 把字符串转成字符数组，适合逐个字符遍历。
- `char` 是基本类型，泛型里要写包装类 `Character`。

### 3. HashMap

```java
Map<Integer, Integer> map = new HashMap<>();
map.put(key, value);
map.get(key);
map.containsKey(key);
map.getOrDefault(key, 0);
```

解释：

- `Map` 是接口，`HashMap` 是常用实现。
- 面试里通常写 `Map<Integer, Integer> map = new HashMap<>();`
- `containsKey` 判断 key 是否存在。
- `get` 根据 key 取 value。
- `getOrDefault(key, 0)` 表示有就取值，没有就返回默认值 `0`。

### 4. 栈 Deque

```java
Deque<Character> stack = new ArrayDeque<>();
stack.push(c);
stack.pop();
stack.peek();
stack.isEmpty();
```

解释：

- Java 里更推荐用 `Deque` 当栈，而不是老的 `Stack` 类。
- `ArrayDeque` 比 `Stack` 更轻量，适合做栈。
- `push` 入栈，`pop` 出栈，`peek` 看栈顶但不弹出。

### 5. HashSet

```java
Set<Integer> set = new HashSet<>();
set.contains(x);
set.add(x);
```

解释：

- `Set` 是集合，特点是不能放重复元素。
- `HashSet` 是最常用实现，适合判断“某个值以前是否出现过”。
- `contains` 判断是否存在。
- `add` 加入元素。
- 和 `HashMap` 相比，`HashSet` 只关心 key 是否存在，不需要存 value。

### 6. ArrayList

```java
List<Integer> list = new ArrayList<>();
list.add(x);
list.get(i);
list.size();
list.isEmpty();
```

解释：

- `List` 是接口，`ArrayList` 是常用实现。
- 结果数量不固定时，用 `ArrayList`。
- `size()` 有括号。

### 7. Queue

```java
Queue<TreeNode> queue = new LinkedList<>();
queue.offer(root);
queue.poll();
queue.isEmpty();
queue.size();
```

解释：

- 队列是先进先出，适合 BFS / 层序遍历。
- `offer` 入队。
- `poll` 出队。
- `LinkedList` 常用来实现 `Queue`。

### 8. 排序

```java
Arrays.sort(nums);
Arrays.sort(chars);
Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1]));
```

解释：

- `Arrays.sort(nums)`：给一维 `int[]` 从小到大排序。
- `Arrays.sort(chars)`：给 `char[]` 按字符顺序排序。
- `Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]))`：给二维数组按每个小数组第一个值排序。
- `Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1]))`：给二维数组按每个小数组第二个值排序。
- 二维数组排序里，`a` 和 `b` 都是一个小数组，比如 `[1, 3]`。
- `a[0]` 和 `b[0]` 是两个小数组的第一个值。

不要优先写：

```java
Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
```

原因：

- `a[0] - b[0]` 更短，但极端情况下可能整数溢出。
- `Integer.compare(a[0], b[0])` 更稳，面试里也更规范。

### 9. 高频工具方法

```java
Math.max(a, b);
Math.min(a, b);
Math.abs(x);

Integer.MAX_VALUE;
Integer.MIN_VALUE;

Arrays.fill(arr, value);
Arrays.copyOf(nums, nums.length);

Collections.reverse(list);

String.valueOf(x);
Integer.parseInt(s);
```

解释：

- `Math.max(a, b)`：取较大值，买卖股票、最大子数组和、树深度常用。
- `Math.min(a, b)`：取较小值，维护最小值时常用。
- `Math.abs(x)`：取绝对值。
- `Integer.MAX_VALUE`：`int` 最大值，适合初始化“最小价格”这类变量。
- `Integer.MIN_VALUE`：`int` 最小值，适合初始化“最大值”这类变量。
- `Arrays.fill(arr, value)`：把数组每个位置填成同一个值。
- `Arrays.copyOf(nums, nums.length)`：复制数组。
- `Collections.reverse(list)`：反转 `List`。
- `String.valueOf(x)`：把数字或字符转成字符串。
- `Integer.parseInt(s)`：把字符串转成 `int`。

### 10. StringBuilder

```java
StringBuilder sb = new StringBuilder();
sb.append(c);
sb.append(num);
sb.reverse();
sb.toString();
```

解释：

- 需要频繁拼字符串时，用 `StringBuilder`，不要一直用 `s = s + c`。
- `append` 追加字符、数字或字符串。
- `reverse` 可以直接反转。
- `toString` 把 `StringBuilder` 转回 `String`。

### 11. Map 计数模板

```java
Map<Character, Integer> map = new HashMap<>();
map.put(c, map.getOrDefault(c, 0) + 1);
```

解释：

- 统计字符或数字出现次数时很常用。
- `getOrDefault(c, 0)` 表示：如果 `c` 不存在，就当它之前出现了 0 次。
- 如果题目限定小写字母，优先用 `int[26]`；如果字符范围不确定，用 `HashMap`。

### 12. Character 工具类

```java
Character.isLetterOrDigit(c);
Character.toLowerCase(c);
```

解释：

- `Character.isLetterOrDigit(c)` 判断字符是不是字母或数字。
- `Character.toLowerCase(c)` 把大写字母转成小写。
- 回文字符串这类题常用，但如果现场题目只包含小写字母，就不一定需要这两个方法。

### 13. 链表节点

```java
class ListNode {
    int val;
    ListNode next;
}
```

解释：

- `val` 是节点值。
- `next` 指向下一个节点。
- 判断两个指针是不是同一个节点，用 `slow == fast`，不是比较 `val`。

### 14. 树节点和递归

```java
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
}

private void dfs(TreeNode node, List<Integer> result) {
    if (node == null) {
        return;
    }
}
```

解释：

- `left` 是左子节点，`right` 是右子节点。
- 递归题一定先写终止条件：`if (node == null) return;`

---

## 题目总表

| 优先级 | LeetCode | 题目 | 主要练什么 |
|---|---:|---|---|
| 1 | 1 | Two Sum 两数之和 | `HashMap`、数组遍历 |
| 2 | 20 | Valid Parentheses 有效括号 | `Deque` 当栈、`char` |
| 3 | 88 | Merge Sorted Array 合并有序数组 | 数组下标、从后往前双指针 |
| 4 | 206 | Reverse Linked List 反转链表 | `ListNode`、指针反转 |
| 5 | 704 | Binary Search 二分查找 | `while`、左右边界 |
| 6 | 387 | First Unique Character 第一个不重复字符 | `String`、`charAt`、计数数组 |
| 7 | 26 | Remove Duplicates from Sorted Array 有序数组去重 | 快慢指针、原地修改 |
| 8 | 121 | Best Time to Buy and Sell Stock 买卖股票 | 一次遍历、`Math.max` |
| 9 | 53 | Maximum Subarray 最大子数组和 | 基础 DP、状态变量 |
| 10 | 56 | Merge Intervals 合并区间 | 二维数组排序、`ArrayList` |
| 11 | 141 | Linked List Cycle 判断链表环 | 快慢指针、节点引用比较 |
| 12 | 102 | Binary Tree Level Order Traversal 二叉树层序遍历 | `Queue`、BFS |
| 13 | 144 / 94 / 145 | 二叉树前序 / 中序 / 后序遍历 | 递归、DFS |
| 14 | 217 | Contains Duplicate 存在重复元素 | `HashSet` |
| 15 | 125 | Valid Palindrome 验证回文串 | 字符串双指针、`Character` |
| 16 | 104 | Maximum Depth of Binary Tree 二叉树最大深度 | 递归返回值 |

---

## 1. LeetCode 1：Two Sum 两数之和

### 类型

数组、哈希表。

### 每天练的语法

```java
Map<Integer, Integer> map = new HashMap<>();
map.containsKey(need);
map.get(need);
map.put(nums[i], i);
return new int[] { map.get(need), i };
```

### 为什么用 HashMap

暴力双循环是 `O(n^2)`。用 `HashMap` 可以一边遍历，一边记录“之前见过的数字 -> 下标”，快速判断当前数字需要的另一个数是否出现过。

### 代码

```java
import java.util.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();

        for (int i = 0; i < nums.length; i++) {
            int need = target - nums[i];
            if (map.containsKey(need)) {
                return new int[] { map.get(need), i };
            }
            map.put(nums[i], i);
        }

        return new int[] { -1, -1 };
    }
}
```

### 复杂度

- 时间：`O(n)`
- 空间：`O(n)`

### 注意事项和易错点

- `map` 里存的是已经遍历过的数字，不要先 `put` 当前数字再查，否则可能用同一个元素两次。
- `need = target - nums[i]`，不是 `nums[i] - target`。
- 返回的是下标，不是数字本身。
- `return new int[] { map.get(need), i };` 这里是新建数组返回两个下标。
- `Map<Integer, Integer>` 泛型里写 `Integer`，不要写 `int`。

### 现场讲法

“我用 HashMap 保存已经遍历过的数字和下标。对当前数字，计算 target 减当前值得到 need，如果 need 已经在 map 里，就找到了两个下标。否则把当前数字放进 map。”

---

## 2. LeetCode 20：Valid Parentheses 有效括号

### 类型

栈、字符串。

### 每天练的语法

```java
Deque<Character> stack = new ArrayDeque<>();
for (char c : s.toCharArray()) {
}
stack.push(c);
stack.pop();
stack.isEmpty();
```

### 为什么用 ArrayDeque

括号匹配是“最后出现的左括号最先被匹配”，这就是栈。Java 里推荐用 `Deque` 接口配 `ArrayDeque` 实现栈，写法简单，效率也好。老的 `Stack` 类不推荐作为新代码首选。

### 不建 HashMap 代码，现场优先写这个

```java
import java.util.*;

class Solution {
    public boolean isValid(String s) {
        Deque<Character> stack = new ArrayDeque<>();

        for (char c : s.toCharArray()) {
            if (c == '(' || c == '[' || c == '{') {
                stack.push(c);
            } else {
                if (stack.isEmpty()) {
                    return false;
                }

                char left = stack.pop();

                if (c == ')' && left != '(') return false;
                if (c == ']' && left != '[') return false;
                if (c == '}' && left != '{') return false;
            }
        }

        return stack.isEmpty();
    }
}
```

### 建 HashMap 代码，能看懂即可

```java
import java.util.*;

class Solution {
    public boolean isValid(String s) {
        Map<Character, Character> map = new HashMap<>();
        map.put(')', '(');
        map.put(']', '[');
        map.put('}', '{');

        Deque<Character> stack = new ArrayDeque<>();

        for (char c : s.toCharArray()) {
            if (c == '(' || c == '[' || c == '{') {
                stack.push(c);
            } else {
                if (stack.isEmpty()) {
                    return false;
                }

                char left = stack.pop();
                if (left != map.get(c)) {
                    return false;
                }
            }
        }

        return stack.isEmpty();
    }
}
```

### 复杂度

- 时间：`O(n)`
- 空间：`O(n)`

### 注意事项和易错点

- 遇到右括号时，必须先判断 `stack.isEmpty()`，否则 `pop()` 会报错。
- 最后一定要 `return stack.isEmpty();`，否则 `"("` 这种情况会误判。
- `Deque<Character>` 里是 `Character`，不是 `char`。
- 现场优先写不建 `HashMap` 版本，少记语法，更稳。
- `pop()` 会弹出栈顶；如果只是看栈顶才用 `peek()`。

### 现场讲法

“我用栈保存还没匹配的左括号。遇到左括号入栈，遇到右括号就弹出栈顶比较。如果栈空或者类型不匹配，返回 false。最后栈为空才说明全部匹配。”

---

## 3. LeetCode 88：Merge Sorted Array 合并有序数组

### 类型

数组、双指针。

### 每天练的语法

```java
int p1 = m - 1;
int p2 = n - 1;
int p = m + n - 1;
nums1[p] = nums2[p2];
```

### 为什么从后往前

`nums1` 后面本来有空位。从后往前填，不会覆盖 `nums1` 前面还没有处理的有效数据。

### 代码

```java
class Solution {
    public void merge(int[] nums1, int m, int[] nums2, int n) {
        int p1 = m - 1;
        int p2 = n - 1;
        int p = m + n - 1;

        while (p1 >= 0 && p2 >= 0) {
            if (nums1[p1] > nums2[p2]) {
                nums1[p] = nums1[p1];
                p1--;
            } else {
                nums1[p] = nums2[p2];
                p2--;
            }
            p--;
        }

        while (p2 >= 0) {
            nums1[p] = nums2[p2];
            p2--;
            p--;
        }
    }
}
```

### 复杂度

- 时间：`O(m + n)`
- 空间：`O(1)`

### 注意事项和易错点

- 三个指针初始值要写对：`p1 = m - 1`，`p2 = n - 1`，`p = m + n - 1`。
- 主循环条件是 `p1 >= 0 && p2 >= 0`。
- 最后只需要补 `nums2`，不用补 `nums1`，因为 `nums1` 剩下的元素本来就在正确位置。
- 从后往前写是为了避免覆盖 `nums1` 前面的有效数据。
- 现场可以分开写 `nums1[p] = ...; p--;`，不用强行写 `nums1[p--] = ...`。

### 现场讲法

“我用三个指针从后往前合并。p1 指向 nums1 有效部分末尾，p2 指向 nums2 末尾，p 指向 nums1 总末尾。每次把较大的数放到 p 位置。”

---

## 4. LeetCode 206：Reverse Linked List 反转链表

### 类型

链表、指针反转。

### 每天练的语法

```java
ListNode prev = null;
ListNode curr = head;
ListNode next = curr.next;
curr.next = prev;
```

### 为什么要保存 next

反转 `curr.next` 之前，必须先保存原来的下一个节点。否则改完 `curr.next` 后，后面的链表就找不到了。

### 代码

```java
class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null;
        ListNode curr = head;

        while (curr != null) {
            ListNode next = curr.next;
            curr.next = prev;
            prev = curr;
            curr = next;
        }

        return prev;
    }
}
```

### 复杂度

- 时间：`O(n)`
- 空间：`O(1)`

### 注意事项和易错点

- 改 `curr.next` 之前必须先保存 `ListNode next = curr.next;`。
- 循环条件是 `curr != null`，不是 `head != null`。
- 最后返回 `prev`，不是 `curr`，因为循环结束时 `curr` 已经是 `null`。
- 空链表 `head == null` 时，代码会直接返回 `null`，不用额外处理。
- 链表题要想清楚变量是节点引用，不是数组下标。

### 现场讲法

“我用 prev、curr、next 三个指针。每次先保存 curr.next，再把 curr.next 指向 prev，然后 prev 和 curr 一起往后移动。最后 prev 就是新头节点。”

---

## 5. LeetCode 704：Binary Search 二分查找

### 类型

二分、有序数组。

### 每天练的语法

```java
int left = 0;
int right = nums.length - 1;
int mid = left + (right - left) / 2;
```

### 为什么 mid 这么写

`left + right` 在极端情况下可能整数溢出。`left + (right - left) / 2` 更稳。

### 代码

```java
class Solution {
    public int search(int[] nums, int target) {
        int left = 0;
        int right = nums.length - 1;

        while (left <= right) {
            int mid = left + (right - left) / 2;

            if (nums[mid] == target) {
                return mid;
            } else if (nums[mid] < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }

        return -1;
    }
}
```

### 复杂度

- 时间：`O(log n)`
- 空间：`O(1)`

### 注意事项和易错点

- 循环条件是 `left <= right`，因为左右相等时还有一个元素要检查。
- 中点写 `left + (right - left) / 2`，避免极端情况下溢出。
- `nums[mid] < target` 时，说明目标在右边，写 `left = mid + 1`。
- `nums[mid] > target` 时，说明目标在左边，写 `right = mid - 1`。
- 找不到时返回 `-1`。

### 现场讲法

“因为数组有序，所以每次看中间值。如果中间值小于 target，就去右半边；如果大于 target，就去左半边；相等直接返回。”

---

## 6. LeetCode 387：First Unique Character 第一个不重复字符

### 类型

字符串、计数数组。

### 每天练的语法

```java
int[] count = new int[26];
char c = s.charAt(i);
count[c - 'a']++;
s.length();
```

### 为什么用 int[26]

如果题目限定小写英文字母，只有 26 种字符。用数组比 `HashMap` 更简单，也更适合现场手写。

### 代码

```java
class Solution {
    public int firstUniqChar(String s) {
        int[] count = new int[26];

        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            count[c - 'a']++;
        }

        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (count[c - 'a'] == 1) {
                return i;
            }
        }

        return -1;
    }
}
```

### 复杂度

- 时间：`O(n)`
- 空间：`O(1)`

### 注意事项和易错点

- 题目限定小写字母时才适合 `int[26]`。
- 字符转下标写 `c - 'a'`。
- 字符串长度是 `s.length()`，不是 `s.length`。
- 第二遍必须按原字符串顺序扫，才能找到“第一个”不重复字符。
- 没找到要返回 `-1`。

### 现场讲法

“我先用长度 26 的数组统计每个小写字母出现次数。第二遍按原字符串顺序找第一个计数为 1 的字符，返回下标。”

---

## 7. LeetCode 26：Remove Duplicates from Sorted Array 有序数组去重

### 类型

数组、双指针、原地修改。

### 每天练的语法

```java
if (nums == null || nums.length == 0) {
    return 0;
}
int slow = 0;
for (int fast = 1; fast < nums.length; fast++) {
}
```

### 为什么用双指针

数组已经有序，重复元素一定相邻。`slow` 维护去重后的最后位置，`fast` 负责扫描新元素。

### 代码

```java
class Solution {
    public int removeDuplicates(int[] nums) {
        if (nums == null || nums.length == 0) {
            return 0;
        }

        int slow = 0;

        for (int fast = 1; fast < nums.length; fast++) {
            if (nums[fast] != nums[slow]) {
                slow++;
                nums[slow] = nums[fast];
            }
        }

        return slow + 1;
    }
}
```

### 复杂度

- 时间：`O(n)`
- 空间：`O(1)`

### 注意事项和易错点

- 这题依赖“数组已经有序”，无序数组不能这么做。
- 空数组要先返回 `0`。
- `slow` 是去重后最后一个有效元素的下标，所以返回 `slow + 1`。
- 遇到新元素时要先 `slow++`，再写 `nums[slow] = nums[fast]`。
- 题目只要求前 `k` 个元素正确，后面的内容不用管。

### 现场讲法

“slow 指向去重后最后一个元素，fast 向后扫描。遇到和 nums[slow] 不同的新值，就 slow++，再把新值写到 nums[slow]。”

---

## 8. LeetCode 121：Best Time to Buy and Sell Stock 买卖股票

### 类型

数组、一次遍历。

### 每天练的语法

```java
int minPrice = Integer.MAX_VALUE;
int maxProfit = 0;
Math.max(maxProfit, price - minPrice);
```

### 为什么维护 minPrice

卖出必须发生在买入之后。遍历到当天时，只需要知道之前见过的最低买入价，就能计算当天卖出的利润。

### 代码

```java
class Solution {
    public int maxProfit(int[] prices) {
        int minPrice = Integer.MAX_VALUE;
        int maxProfit = 0;

        for (int price : prices) {
            if (price < minPrice) {
                minPrice = price;
            } else {
                maxProfit = Math.max(maxProfit, price - minPrice);
            }
        }

        return maxProfit;
    }
}
```

### 复杂度

- 时间：`O(n)`
- 空间：`O(1)`

### 注意事项和易错点

- 利润是 `price - minPrice`，不是 `price - maxProfit`。
- `minPrice` 表示历史最低买入价，`maxProfit` 表示最大利润，两个变量含义不能混。
- 如果价格一直下跌，最大利润应该是 `0`。
- `Integer.MAX_VALUE` 用来保证第一天价格一定能更新最低价。
- 只能先买后卖，所以每一天只用它之前的最低价计算利润。

### 现场讲法

“我遍历价格，维护到目前为止的最低买入价 minPrice。每天都尝试用当天价格卖出，利润是 price - minPrice，然后更新最大利润。”

---

## 9. LeetCode 53：Maximum Subarray 最大子数组和

### 类型

数组、基础动态规划。

### 每天练的语法

```java
int current = nums[0];
int best = nums[0];
current = Math.max(nums[i], current + nums[i]);
best = Math.max(best, current);
```

### 为什么从 nums[0] 初始化

数组可能全是负数。如果初始化成 0，会错误返回 0。用 `nums[0]` 初始化可以处理全负数。

### 代码

```java
class Solution {
    public int maxSubArray(int[] nums) {
        int current = nums[0];
        int best = nums[0];

        for (int i = 1; i < nums.length; i++) {
            current = Math.max(nums[i], current + nums[i]);
            best = Math.max(best, current);
        }

        return best;
    }
}
```

### 复杂度

- 时间：`O(n)`
- 空间：`O(1)`

### 注意事项和易错点

- `current` 和 `best` 都要用 `nums[0]` 初始化，不能用 `0`，否则全负数会错。
- 循环从 `i = 1` 开始，因为第一个元素已经初始化过。
- `current` 表示“必须以当前位置结尾”的最大和。
- 每一步判断是接上前面，还是从当前重新开始。
- 题目要求连续子数组，不能跳着选。

### 现场讲法

“current 表示以当前位置结尾的最大连续和。每次判断是接上前面的和，还是从当前元素重新开始。best 记录全局最大值。”

---

## 10. LeetCode 56：Merge Intervals 合并区间

### 类型

二维数组排序、区间合并。

### 每天练的语法

```java
Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
List<int[]> result = new ArrayList<>();
result.isEmpty();
result.get(result.size() - 1);
result.toArray(new int[result.size()][]);
```

### 为什么先排序

先按每个小数组第一个值排序。排完后，只需要拿结果列表最后一个区间和当前区间比较。

### 为什么用 ArrayList

合并后有多少个区间不确定，所以先用 `ArrayList` 动态保存结果，最后再转成 `int[][]`。

### 代码

```java
import java.util.*;

class Solution {
    public int[][] merge(int[][] intervals) {
        if (intervals == null || intervals.length == 0) {
            return new int[0][0];
        }

        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));

        List<int[]> result = new ArrayList<>();

        for (int[] interval : intervals) {
            if (result.isEmpty()) {
                result.add(interval);
            } else {
                int[] last = result.get(result.size() - 1);

                if (last[1] >= interval[0]) {
                    last[1] = Math.max(last[1], interval[1]);
                } else {
                    result.add(interval);
                }
            }
        }

        return result.toArray(new int[result.size()][]);
    }
}
```

### 复杂度

- 时间：`O(n log n)`
- 空间：`O(n)`

### 注意事项和易错点

- 先按每个小数组第一个值排序：`Integer.compare(a[0], b[0])`。
- 比较的是结果列表最后一个区间 `last` 和当前区间 `interval`，不是简单比较原数组相邻两个。
- 重叠条件可以写 `last[1] >= interval[0]`。
- 合并时更新右边界：`last[1] = Math.max(last[1], interval[1])`。
- 不重叠时只需要 `result.add(interval)`，因为 `last` 已经在结果里。
- `List<int[]>` 转二维数组的写法可以直接背：`result.toArray(new int[result.size()][])`。

### 现场讲法

“我先按每个区间的第一个值排序。然后维护一个结果列表，每次拿结果列表最后一个区间和当前区间比较。如果最后区间的结束值大于等于当前区间的开始值，就合并；否则把当前区间加入结果。”

---

## 11. LeetCode 141：Linked List Cycle 判断链表环

### 类型

链表、快慢指针。

### 每天练的语法

```java
ListNode slow = head;
ListNode fast = head;
while (fast != null && fast.next != null) {
    slow = slow.next;
    fast = fast.next.next;
}
if (slow == fast) {
}
```

### 为什么用快慢指针

如果无环，快指针会走到 `null`。如果有环，快指针会在环里追上慢指针。

### 代码

```java
public class Solution {
    public boolean hasCycle(ListNode head) {
        ListNode slow = head;
        ListNode fast = head;

        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;

            if (slow == fast) {
                return true;
            }
        }

        return false;
    }
}
```

### 复杂度

- 时间：`O(n)`
- 空间：`O(1)`

### 注意事项和易错点

- 循环条件必须是 `fast != null && fast.next != null`，因为 `fast` 每次走两步。
- 快指针更新写 `fast = fast.next.next`，不要写成 `slow.next.next`。
- 判断相遇写 `slow == fast`，比较的是同一个节点引用。
- 不要比较 `slow.val == fast.val`，不同节点的值可能一样。
- 空链表或单节点无环时，会直接返回 `false`。

### 现场讲法

“slow 每次走一步，fast 每次走两步。没有环时 fast 会到 null；有环时 fast 会追上 slow。这里比较的是节点引用，所以写 slow == fast。”

---

## 12. LeetCode 102：Binary Tree Level Order Traversal 二叉树层序遍历

### 类型

二叉树、BFS、队列。

### 每天练的语法

```java
List<List<Integer>> result = new ArrayList<>();
Queue<TreeNode> queue = new LinkedList<>();
queue.offer(root);
TreeNode node = queue.poll();
int size = queue.size();
```

### 为什么用 Queue

层序遍历是一层一层从左到右处理。队列是先进先出，正好适合 BFS。

### 为什么每轮先记录 size

`queue.size()` 代表当前层有几个节点。先记录下来，for 循环只处理当前层，下一层节点虽然会被加入队列，但不会混进当前层。

### 代码

```java
import java.util.*;

class Solution {
    public List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> result = new ArrayList<>();

        if (root == null) {
            return result;
        }

        Queue<TreeNode> queue = new LinkedList<>();
        queue.offer(root);

        while (!queue.isEmpty()) {
            int size = queue.size();
            List<Integer> level = new ArrayList<>();

            for (int i = 0; i < size; i++) {
                TreeNode node = queue.poll();
                level.add(node.val);

                if (node.left != null) {
                    queue.offer(node.left);
                }

                if (node.right != null) {
                    queue.offer(node.right);
                }
            }

            result.add(level);
        }

        return result;
    }
}
```

### 复杂度

- 时间：`O(n)`
- 空间：`O(n)`

### 注意事项和易错点

- `root == null` 时返回空 `result`。
- 队列写 `Queue<TreeNode> queue = new LinkedList<>();`。
- 每轮 while 开始先记录 `int size = queue.size();`，这是当前层节点数。
- for 循环只跑 `size` 次，避免把下一层节点混到当前层。
- 左右孩子非空才入队，否则会空指针或多出无效节点。
- 返回类型是 `List<List<Integer>>`，外层是所有层，内层是一层的值。

### 现场讲法

“我用队列做 BFS。每轮 while 处理一层，先记录当前队列 size，然后 for 循环处理这一层节点，把节点值加入 level，并把左右孩子入队。当前层结束后把 level 加入 result。”

---

## 13. LeetCode 144 / 94 / 145：二叉树前序 / 中序 / 后序遍历

### 类型

二叉树、递归、DFS。

### 每天练的语法

```java
List<Integer> result = new ArrayList<>();
private void dfs(TreeNode node, List<Integer> result) {
    if (node == null) {
        return;
    }
}
```

### 为什么补这组题

前 12 题已经覆盖了树的 BFS，但还缺最基础的递归 DFS。前序、中序、后序只差 `result.add(node.val)` 的位置，代码短、语法价值高。

### 前序遍历 LeetCode 144：根 左 右

```java
import java.util.*;

class Solution {
    public List<Integer> preorderTraversal(TreeNode root) {
        List<Integer> result = new ArrayList<>();
        dfs(root, result);
        return result;
    }

    private void dfs(TreeNode node, List<Integer> result) {
        if (node == null) {
            return;
        }

        result.add(node.val);
        dfs(node.left, result);
        dfs(node.right, result);
    }
}
```

### 中序遍历 LeetCode 94：左 根 右

```java
import java.util.*;

class Solution {
    public List<Integer> inorderTraversal(TreeNode root) {
        List<Integer> result = new ArrayList<>();
        dfs(root, result);
        return result;
    }

    private void dfs(TreeNode node, List<Integer> result) {
        if (node == null) {
            return;
        }

        dfs(node.left, result);
        result.add(node.val);
        dfs(node.right, result);
    }
}
```

### 后序遍历 LeetCode 145：左 右 根

```java
import java.util.*;

class Solution {
    public List<Integer> postorderTraversal(TreeNode root) {
        List<Integer> result = new ArrayList<>();
        dfs(root, result);
        return result;
    }

    private void dfs(TreeNode node, List<Integer> result) {
        if (node == null) {
            return;
        }

        dfs(node.left, result);
        dfs(node.right, result);
        result.add(node.val);
    }
}
```

### 复杂度

- 时间：`O(n)`
- 空间：`O(n)`，主要是递归栈和结果列表

### 注意事项和易错点

- 递归第一句一定是 `if (node == null) return;`。
- 前序、中序、后序只差 `result.add(node.val)` 的位置。
- 前序：根左右；中序：左根右；后序：左右根。
- 辅助方法可以写成 `private void dfs(TreeNode node, List<Integer> result)`。
- 空树返回空 `List`，不是 `null`。

### 现场讲法

“这题我用递归 DFS。递归终止条件是节点为空。前序、中序、后序的区别只是访问根节点的位置：前序是根左右，中序是左根右，后序是左右根。”

---

## 14. LeetCode 217：Contains Duplicate 存在重复元素

### 类型

数组、`HashSet`。

### 为什么补这题

这是我重新审视后认为应该补的题。原因不是题难，而是它补上了 `HashSet` 这个最基础集合。很多基础题都会问“是否出现过”“是否重复”，`HashSet` 是最直接写法。

### 每天练的语法

```java
Set<Integer> set = new HashSet<>();
set.contains(num);
set.add(num);
```

### 为什么用 HashSet

`HashSet` 只保存元素本身，不保存下标或次数。判断重复时，只需要知道这个数之前有没有出现过，所以 `HashSet` 比 `HashMap` 更简单。

### 代码

```java
import java.util.*;

class Solution {
    public boolean containsDuplicate(int[] nums) {
        Set<Integer> set = new HashSet<>();

        for (int num : nums) {
            if (set.contains(num)) {
                return true;
            }
            set.add(num);
        }

        return false;
    }
}
```

### 复杂度

- 时间：`O(n)`
- 空间：`O(n)`

### 注意事项和易错点

- `HashSet` 只保存元素，不保存次数和下标。
- 先 `contains` 再 `add`，一旦发现已经存在就返回 `true`。
- 遍历结束都没发现重复，返回 `false`。
- `Set<Integer>` 里写 `Integer`，不要写 `int`。
- 这题是最简单的 `HashSet` 模板，主要练语法。

### 现场讲法

“我用 HashSet 保存已经见过的数字。遍历数组时，如果当前数字已经在 set 里，说明重复，直接返回 true；否则加入 set。遍历结束都没重复，就返回 false。”

---

## 15. LeetCode 125：Valid Palindrome 验证回文串

### 类型

字符串、双指针。

### 为什么补这题

这题补的是字符串双指针。原题库有字符串计数和栈，但没有“左右指针处理字符串”的写法。这个题也能顺手复习 `Character` 工具类。

### 每天练的语法

```java
int left = 0;
int right = s.length() - 1;
Character.isLetterOrDigit(s.charAt(left));
Character.toLowerCase(s.charAt(left));
```

### 为什么用双指针

回文串要比较最左和最右是否相等，然后一起往中间靠。遇到非字母数字字符就跳过。

### 代码

```java
class Solution {
    public boolean isPalindrome(String s) {
        int left = 0;
        int right = s.length() - 1;

        while (left < right) {
            while (left < right && !Character.isLetterOrDigit(s.charAt(left))) {
                left++;
            }

            while (left < right && !Character.isLetterOrDigit(s.charAt(right))) {
                right--;
            }

            char a = Character.toLowerCase(s.charAt(left));
            char b = Character.toLowerCase(s.charAt(right));

            if (a != b) {
                return false;
            }

            left++;
            right--;
        }

        return true;
    }
}
```

### 复杂度

- 时间：`O(n)`
- 空间：`O(1)`

### 注意事项和易错点

- 左右指针分别从 `0` 和 `s.length() - 1` 开始。
- 跳过非字母数字字符时，要保持 `left < right`，防止越界。
- 比较前统一转小写：`Character.toLowerCase(...)`。
- `Character.isLetterOrDigit(c)` 是判断字母或数字，不是只判断字母。
- 比较的是两个 `char`，可以用 `a != b`。

### 现场讲法

“我用左右双指针。左指针从前往后，右指针从后往前，跳过非字母数字字符。比较时统一转成小写。如果两边字符不同就返回 false；如果能一直走到中间，说明是回文。”

---

## 16. LeetCode 104：Maximum Depth of Binary Tree 二叉树最大深度

### 类型

二叉树、递归返回值。

### 为什么补这题

前中后序遍历补的是 `void dfs(...)` 这种递归收集结果。二叉树最大深度补的是“递归函数返回一个值”。这是树题里另一种最基础写法，值得单独练。

### 每天练的语法

```java
if (root == null) {
    return 0;
}
int left = maxDepth(root.left);
int right = maxDepth(root.right);
return Math.max(left, right) + 1;
```

### 为什么这样递归

一棵树的最大深度等于左右子树最大深度的较大值，再加上当前根节点这一层。

### 代码

```java
class Solution {
    public int maxDepth(TreeNode root) {
        if (root == null) {
            return 0;
        }

        int left = maxDepth(root.left);
        int right = maxDepth(root.right);

        return Math.max(left, right) + 1;
    }
}
```

### 复杂度

- 时间：`O(n)`
- 空间：`O(n)`，最坏情况下递归栈高度为 `n`

### 注意事项和易错点

- 空节点深度是 `0`，所以 `root == null` 时返回 `0`。
- 递归函数有返回值，和前中后序的 `void dfs` 不一样。
- 当前树深度是 `Math.max(left, right) + 1`，不要忘记 `+ 1`。
- 每个节点只访问一次。
- 空间复杂度看递归栈，最坏链状树是 `O(n)`。

### 现场讲法

“我用递归。空节点深度是 0；非空节点的深度等于左右子树深度最大值加 1。每个节点访问一次，所以时间复杂度 O(n)。”

---

## 现场最容易丢分的 Java 细节

- 数组长度是 `nums.length`，字符串长度是 `s.length()`。
- `HashMap` 写 `Map<Integer, Integer> map = new HashMap<>();`
- `HashSet` 写 `Set<Integer> set = new HashSet<>();`
- 泛型里写 `Integer`、`Character`，不要写 `int`、`char`。
- 栈写 `Deque<Character> stack = new ArrayDeque<>();`
- 队列写 `Queue<TreeNode> queue = new LinkedList<>();`
- `ArrayList` 写 `List<Integer> result = new ArrayList<>();`
- 字符工具类可以用 `Character.isLetterOrDigit(c)` 和 `Character.toLowerCase(c)`。
- 二维数组按第一个值排序写 `Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));`
- 链表反转必须先保存 `ListNode next = curr.next;`
- 链表环比较节点引用，写 `slow == fast`。
- 二分中点写 `left + (right - left) / 2`。
- `List<int[]>` 转 `int[][]` 写 `result.toArray(new int[result.size()][])`。
- 每题最后主动说时间复杂度和空间复杂度。

## Java 语法和方法小贴士

### 1. 长度相关

```java
nums.length      // 数组长度，没有括号
s.length()       // 字符串长度，有括号
list.size()      // List 长度，有括号
queue.size()     // Queue 长度，有括号
```

记法：

- 数组是属性：`.length`
- 字符串和集合是方法：`.length()` / `.size()`

### 2. 泛型只能写包装类

```java
Map<Integer, Integer> map = new HashMap<>();
Set<Integer> set = new HashSet<>();
Deque<Character> stack = new ArrayDeque<>();
```

不要写：

```java
Map<int, int> map = new HashMap<>();      // 错
Deque<char> stack = new ArrayDeque<>();   // 错
```

记法：

- `int` 放进泛型时写 `Integer`
- `char` 放进泛型时写 `Character`

### 3. 常用集合方法

```java
map.put(key, value);
map.get(key);
map.containsKey(key);

set.add(x);
set.contains(x);

list.add(x);
list.get(i);
list.isEmpty();

stack.push(c);
stack.pop();
stack.isEmpty();

queue.offer(node);
queue.poll();
queue.isEmpty();
```

记法：

- `Map` 是 key-value。
- `Set` 只判断有没有。
- `List` 按下标取。
- `Deque` 当栈用：`push` / `pop`。
- `Queue` 当队列用：`offer` / `poll`。

### 4. `==` 和 `.equals`

```java
if (slow == fast) {
    return true;
}
```

链表和树节点比较是不是同一个节点，用 `==`。

字符串内容比较一般用：

```java
s1.equals(s2)
```

这套题里大多数时候比较的是 `int`、`char` 或节点引用，所以直接用 `==`。

### 5. 空值判断先写

```java
if (root == null) {
    return result;
}

if (nums == null || nums.length == 0) {
    return 0;
}
```

记法：

- 链表、树、数组对象可能是 `null`。
- 访问 `.next`、`.left`、`.length` 前，先想会不会空指针。

### 6. 面试里可以少用花哨写法

优先写清楚：

```java
nums1[p] = nums1[p1];
p1--;
p--;
```

不必强行写成：

```java
nums1[p--] = nums1[p1--];
```

现场目标是稳，不是压缩代码。
