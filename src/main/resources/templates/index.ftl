<html>
<head>
    <script src="/bower-libs/jquery/dist/jquery.min.js"></script>
    <script src="/bower-libs/angularjs/angular.min.js"></script>
    <script src="/bower-libs/bootstrap/dist/js/bootstrap.min.js"></script>
    <script src="/bower-libs/requirejs/require.js"></script>
    <link rel="stylesheet" href="/bower-libs/bootstrap/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="/bower-libs/font-awesome/css/font-awesome.min.css">
    <link rel="stylesheet" href="/css/main.css">
    <link href='https://fonts.googleapis.com/css?family=Roboto&subset=latin,cyrillic' rel='stylesheet' type='text/css'>

    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Мои расходы</title>
</head>
<body>
<nav class="navbar navbar-default">
    <div class="container">
        <span class="pull-right login-label">
        <#if authorized>${userName}
            <form action="/logout" id="logout-form">
                <a href="#" onclick="$('#logout-form').submit()"><i class="fa fa-sign-out"></i></a>
            </form>
        <#else>
            <form action="/connect/facebook" id="facebookConnect" method="POST">
            <#--<a href="#" onclick="$('#facebookConnect').submit(); return false"><i class="fa fa-facebook-official"></i> Войти</a>-->
                <a href="/auth/facebook"><i class="fa fa-facebook-official"></i> Войти</a>
                <a href="#" ng-click="c.display.whyShow = !c.display.whyShow"><i class="fa fa-question-circle"></i> Зачем</a>
            </form>
        </#if>
        </span>

        <div class="navbar-header">
            <a class="navbar-brand" href="/">Мои расходы</a>
        </div>
    </div>
</nav>
<div class="container" ng-controller="LightExpensesController" ng-cloak="">

    <div ng-show="c.display.whyShow">
        <div class="panel panel-info">
            <div class="panel-heading">Зачем входить?</div>
            <div class="panel-body">
                После того, как вы войдёте в систему:
                <ul>
                    <li>Вы сможете использовать приложение на разных устройствах.</li>
                    <li>Данные будут автоматически синхронизироваться на сервер.</li>
                </ul>
            </div>
            <div class="panel-footer">
                <a href="#" onclick="$('#facebookConnect').submit(); return false" class="btn btn-primary"><i class="fa fa-facebook-official"></i> Всё понятно, войти</a>
                <a href="#" ng-click="c.display.whyShow = !c.display.whyShow" class="btn btn-sm btn-default"><i class="fa fa-close"></i> Пока что нет, попозже</a>
            </div>
        </div>
    </div>

    <category-list ng-if="c.selectedCategoryId == 'setup'" on-close="c.finishSetup"></category-list>

    <expense-editor parent="c"></expense-editor>

    <h3>История расходов</h3>
    <table class="table">
        <tr ng-repeat-start="expense in c.displayExpenses" ng-class="{editting: c.editExpense.uuid == expense.uuid}">
            <td class="expense-time">{{ expense.date | date:'dd.MM HH:mm' }}</td>
            <td>
                {{ c.getCategory(expense.categoryId).name }}
                <div class="expense-description" ng-if="expense.description" ng-bind="expense.description"></div>
            </td>
            <td class="expense-amount">
                {{ expense.amount|number }}
                <i class="fa fa-check" ng-class="{saved: !category.changed, offline: category.changed, red: c.errorFor(expense)}" title="{{ c.errorFor(expense) }}"></i>
                <i class="fa fa-edit" ng-click="c.toggleEditExpense(expense)"></i>
            </td>
        </tr>
        <tr ng-repeat-end="" ng-if="c.editExpense.uuid == expense.uuid" class="editting">
            <td colspan="3">
                <expense-editor edit="expense" close="c.toggleEditExpense(expense)"></expense-editor>
            </td>
        </tr>
        <tr>
            <td colspan="3">
                <a href="#" class="btn btn-xs btn-info" ng-show="c.displayExpensesNumber < c.possibleExpensesCount" ng-click="c.increaseDisplayExpenses()">Показать ещё</a>
                <a href="#" class="btn btn-xs btn-info" ng-show="c.displayExpensesNumber > 3" ng-click="c.resetDisplayExpenses()">Свернуть</a>
            </td>
        </tr>
    </table>

    <h3>Статистика</h3>
    <table class="table">
        <tr ng-repeat="stat in c.statistics">
            <td>{{ c.getCategory(stat.categoryId).name }}</td>
            <td>{{ stat.amount | number }}</td>
            <td>{{ stat.percent | number:0 }}%</td>
        </tr>
    </table>
</div>


<script type="text/javascript">
    require(['js/lightexpenses'], function (lightexpenses) {
        window.LightExpenses = lightexpenses.LightExpenses;
        window.LightExpenses.value("angularData", ${json.writeValueAsString(angularData)});
        angular.bootstrap(document, ['LightExpenses']);
    })
</script>

</body>
</html>