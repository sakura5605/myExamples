'use strict';

angular.module('myApp.calculator', ['ngRoute'])
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/calculator', {
            templateUrl: 'calculator/calculator.html',
            controller: 'CalculatorCtrl'
        });
    }])
    .directive('calculatorDir', [function() {
        return {
            restrict: 'ACE', //a attr e element  c class  scope
            templateUrl: 'directives/calculatorDir.html'
        }
    }])
    .controller('CalculatorCtrl', function($scope, calFactory) {
        //计算时用的数字的栈
        $scope.num = [];
        //用户输入的所有按键
        $scope.history = [];
        //接受输入用的运算符栈
        $scope.opt = [];
        //计算器计算结果
        $scope.result = "";
        //表示是否要重新开始显示,为true表示不重新显示，false表示要清空当前输出重新显示数字
        $scope.IsContinue = true;
        //表示当前是否可以再输入运算符，如果可以为true，否则为false
        $scope.isOpt = true;

        $scope.showResult = function(a) {
            var b = calFactory.showResult(a, {
                num: $scope.num,
                history: $scope.history,
                opt: $scope.opt,
                result: $scope.result,
                IsContinue: $scope.IsContinue,
                isOpt: $scope.isOpt
            });

            $scope.num = b.num;
            $scope.history = b.history;
            $scope.opt = b.opt;
            $scope.result = b.result;
            $scope.IsContinue = b.IsContinue;
            $scope.isOpt = b.isOpt;
        }
    })
    .factory('calFactory', function() {

        var func = {}; //定义一个Object对象

        func.showResult = function(a, b) {

            //判断当前运算符是否优先级高于last，如果是返回true,否则返回false
            var isPri = function(current, last) {
                if (current == last) {
                    return false;
                } else {
                    if (current == "×" || current == "÷") {
                        if (last == "×" || last == "÷") {
                            return false;
                        } else {
                            return true;
                        }
                    } else {
                        return false;
                    }
                }
            };

            //判断当前符号是否是可运算符号
            var checkOperator = function(opt) {
                if (opt == "＋" || opt == "－" || opt == "×" || opt == "÷") {
                    return true;
                }
                return false;
            }

            //格式化result输出
            var format = function(num) {
                var regNum = /.{10,}/ig;
                if (regNum.test(num)) {
                    if (/\./.test(num)) {
                        return num.toExponential(3);
                    } else {
                        return num.toExponential();
                    }
                } else {
                    return num;
                }
            }

            //初始化状态
            var init = function() {
                b.num = [];
                b.opt = [];
                b.history = [];
                b.IsContinue = true;
                b.isOpt = true;
            };

            //负责计算结果函数
            var calculate = function(left, operator, right) {
                switch (operator) {
                    case "＋":
                        b.result = format(Number(left) + Number(right));
                        b.num.push(b.result);
                        break;
                    case "－":
                        b.result = format(Number(left) - Number(right));
                        b.num.push(b.result);
                        break;
                    case "×":
                        b.result = format(Number(left) * Number(right));
                        b.num.push(b.result);
                        break;
                    case "÷":
                        if (right == 0) {
                            b.result = "error";
                            init();
                        } else {
                            b.result = format(Number(left) / Number(right));
                            b.num.push(b.result);
                        }
                        break;
                    default:
                        break;
                }
            };

            //比较当前输入的运算符和运算符栈栈顶运算符的优先级
            //如果栈顶运算符优先级小，则将当前运算符进栈，并且不计算，
            //否则栈顶运算符出栈，且数字栈连续出栈两个元素，进行计算
            //然后将当前运算符进栈。
            var operation = function(current) {
                //如果运算符栈为空，直接将当前运算符入栈
                if (!b.opt.length) {
                    b.opt.push(current);
                    return;
                }
                var operator, right, left;
                var lastOpt = b.opt[b.opt.length - 1];
                //如果当前运算符优先级大于last运算符，仅进栈
                if (isPri(current, lastOpt)) {
                    b.opt.push(current);
                } else {
                    operator = b.opt.pop();
                    right = b.num.pop();
                    left = b.pop();
                    calculate(left, operator, right);
                    operation(current);
                }
            };

            b.history.push(a);
            var reg = /\d/ig,
                regDot = /\./ig,
                regAbs = /\//ig;

            //如果点击的是个数字
            if (reg.test(a)) {
                //消除冻结
                b.isOpt = true;
                if (b.result != 0 && b.IsContinue && b.result != "error") {
                    b.result += a;
                } else {
                    b.result = a;
                    b.IsContinue = true;
                }
            }
            //如果点击的是AC
            else if (a == "AC") {
                b.result = 0;
                init();
            }
            //如果点击的是个小数点
            else if (a == ".") {
                if (b.result != "" && !regDot.test(b.result)) {
                    b.result += a;
                }
            }
            //如果点击的是个取反操作符
            else if (regAbs.test(a)) {
                if (b.result > 0) {
                    b.result = "-" + b.result;
                } else {
                    b.result = Math.abs(b.result);
                }
            }
            //如果点击的是个百分号
            else if (a == "%") {
                b.result = format(Number(b.result) / 100);

            }
            //如果点击的是个运算符且当前显示结果不为空和error
            else if (checkOperator(a) && b.result != "" && b.result != "error" && b.isOpt) {
                b.IsContinue = false;
                b.num.push(b.result);
                operation(a);
                //点击一次运算符之后需要将再次点击运算符的情况忽略掉
                b.isOpt = false;
            }
            //如果点击的是等于号
            else if (a == "=" && b.result != "" && b.result != "error") {
                b.IsContinue = false;
                b.num.push(b.result);
                while (b.opt.length != 0) {
                    var operator = b.opt.pop();
                    var right = b.num.pop();
                    var left = b.num.pop();
                    calculate(left, operator, right);
                }
            }

            return b;
        }

        return func; //返回这个Object对象
    })
